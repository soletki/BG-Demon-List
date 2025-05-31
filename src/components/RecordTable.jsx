import React from 'react';
import './RecordTable.css';

export default function RecordTable({ records }){
  return (
    <div className="record-table-container">
      <h3 className="record-table-title">Records</h3>
      <table className="record-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Progress</th>
            <th>Video</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={record.id}>
              <td>{index + 1}</td>
              <td>{record.player}</td>
              <td>{record.progress}%</td>
              <td>
                {record.video ? (
                  <a href={record.video} target="_blank" rel="noopener noreferrer">
                    Watch
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
