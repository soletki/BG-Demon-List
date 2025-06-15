import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
	const [scrolled, setScrolled] = useState(false);
	const location = useLocation();

	useEffect(() => {
		const handleScroll = () => {
			const isScrolled = window.scrollY > 20;
			setScrolled(isScrolled);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const isActive = (path) => {
		return location.pathname === path;
	};

	return (
		<header className={scrolled ? 'scrolled' : ''}>
			<h3 id="logo">
				<a href="/">BGDL</a>
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
					<li>
						<a href="/" className={isActive('/') ? 'active' : ''}>
							Demon List
						</a>
					</li>
				</ul>
			</nav>
		</header>
	);
}
