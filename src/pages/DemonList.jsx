import { useEffect, useState } from 'react';
import axios from 'axios';
import './DemonList.css';
import './global.css';
import Navbar from '../components/Navbar';

export default function DemonList() {
	const [levels, setLevels] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(true);
	
	useEffect(() => {
		const fetchLevels = async () => {
			try {
				const response = await axios.get('/levels');
				if (Array.isArray(response.data)) {
					const sorted = response.data.sort(
						(a, b) => a.position - b.position
					);
					setLevels(sorted);
				} else {
					console.error('Expected an array but got:', response.data);
				}
			} catch (error) {
				console.error('Failed to fetch levels:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchLevels();
	}, []);
	const filteredLevels = levels.filter((level) =>
		level.name.toLowerCase().includes(searchTerm.toLowerCase())
	)
	.sort((a, b)=> a.position - b.position);

	if (loading) return <p className="text-center mt-10">Loading...</p>;

	return (
		<div>
            <Navbar></Navbar>
			
			<div id="levels-container">
				<div id='search-bar'>
					<input
						type="text"
						placeholder="Search..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				
				{filteredLevels.map((level) => {
					const videoId = extractYouTubeId(level.video);
					return (
						<div className="level-container" key={level.position}>
                            <a href={`${level.video}`}>
                                <img
                                    className="level-img"
                                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                    alt={level.name}
                                />
                            </a>
							
							<div className="level-text-container">
								<a href={`/level/${level.position}`}><h4 className="level-name">
									#{level.position} - {level.name}
								</h4></a>
								<p className="level-creator">
									{level.creators[0]}
								</p>
							</div>
						</div>
						
					);
				})}
			</div>
		</div>
	);
}

function extractYouTubeId(url) {
	const regex =
		/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/;
	const match = url.match(regex);
	return match ? match[1] : '';
}
