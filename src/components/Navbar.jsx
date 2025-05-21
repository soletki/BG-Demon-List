import React from 'react';
import './Navbar.css'; // optional, if you want to style it separately

export default function Navbar() {
  return (
    <header>
      <h3 id="logo">
        <a href="/">BDL</a>
      </h3>
      <nav>
        <ul id="nav_links">
          <li><a href="/leaderboard">Leaderboard</a></li>
        </ul>
      </nav>
    </header>
  );
}
