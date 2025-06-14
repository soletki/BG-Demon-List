import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from '../api/firebase-user';
import { onAuthStateChanged } from 'firebase/auth';
import './Navbar.css';
import axios from 'axios';

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const [loggedIn, setLoggedIn] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const location = useLocation();

	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 20;
			setScrolled(isScrolled);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				const uid = user.uid;
				setIsAdmin(
					(await axios.get(`/users/${uid}/admin`)).data.isAdmin
				);
				setLoggedIn(true);
			} else {
				setLoggedIn(false);
			}
		});

		return () => unsubscribe();
	}, []);

	const isActive = (path) => {
		return location.pathname === path;
	};

	return (
		<header className={scrolled ? 'scrolled' : ''}>
			<h3 id="logo">
				<a href="/">BDL</a>
			</h3>
			<nav>
				<ul id="nav_links">
					<li>
						<a
							href="/leaderboard"
							className={isActive('/leaderboard') ? 'active' : ''}
						>
							Leaderboard
						</a>
					</li>
					{loggedIn && (
						<li>
							<a
								href="/submit"
								className={isActive('/submit') ? 'active' : ''}
							>
								Submit
							</a>
						</li>
					)}
					{loggedIn ? (
						<li>
							<a
								href="/account"
								className={isActive('/auth') ? 'active' : ''}
							>
								Account
							</a>
						</li>
					) : (
						<li>
							<a
								href="/auth"
								className={isActive('/auth') ? 'active' : ''}
							>
								Sign Up
							</a>
						</li>
					)}

					{isAdmin && (
						<li>
							<a
								href="/admin"
								className={isActive('/admin') ? 'active' : ''}
							>
								Admin
							</a>
						</li>
					)}
				</ul>
			</nav>
		</header>
	);
}
