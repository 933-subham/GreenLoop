import React from 'react';

const LoaderSpinner = ({ message = "Loading data..." }) => {
    return (
        <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 w-100 min-vh-50" style={{ minHeight: '300px' }}>
            <div className="spinner-border text-success mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                <span className="visually-hidden">Loading...</span>
            </div>
            <h6 className="text-muted fw-semibold">{message}</h6>
        </div>
    );
};

export default LoaderSpinner;
