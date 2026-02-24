import React from 'react';

/**
 * ProfileCompletionBar Component
 * Displays a circular progress indicator for profile completion percentage
 * 
 * @param {number} percentage - Completion percentage (0-100)
 * @param {string} size - Size variant: 'small', 'medium', 'large'
 * @param {boolean} showLabel - Whether to show the percentage label
 */
const ProfileCompletionBar = ({ percentage = 0, size = 'medium', showLabel = true }) => {
    // Ensure percentage is between 0 and 100
    const validPercentage = Math.min(100, Math.max(0, percentage));

    // Size configurations
    const sizeConfig = {
        small: {
            diameter: 60,
            strokeWidth: 6,
            fontSize: '0.75rem',
            labelFontSize: '0.7rem'
        },
        medium: {
            diameter: 100,
            strokeWidth: 8,
            fontSize: '1.25rem',
            labelFontSize: '0.85rem'
        },
        large: {
            diameter: 140,
            strokeWidth: 10,
            fontSize: '1.75rem',
            labelFontSize: '1rem'
        }
    };

    const config = sizeConfig[size] || sizeConfig.medium;
    const { diameter, strokeWidth, fontSize, labelFontSize } = config;

    // Calculate circle properties
    const radius = (diameter - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (validPercentage / 100) * circumference;

    // Determine color based on percentage
    const getColor = () => {
        if (validPercentage < 30) return '#ef4444'; // Red
        if (validPercentage < 70) return '#f59e0b'; // Yellow/Orange
        return '#10b981'; // Green
    };

    const color = getColor();

    return (
        <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
        }}>
            <div style={{ position: 'relative', width: diameter, height: diameter }}>
                {/* Background circle */}
                <svg
                    width={diameter}
                    height={diameter}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    <circle
                        cx={diameter / 2}
                        cy={diameter / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(148, 163, 184, 0.2)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <circle
                        cx={diameter / 2}
                        cy={diameter / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        style={{
                            transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease'
                        }}
                    />
                </svg>

                {/* Percentage text */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize,
                        fontWeight: '700',
                        color: '#f1f5f9',
                        lineHeight: 1
                    }}>
                        {Math.round(validPercentage)}%
                    </div>
                </div>
            </div>

            {showLabel && (
                <div style={{
                    fontSize: labelFontSize,
                    color: '#94a3b8',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Profile Complete
                </div>
            )}
        </div>
    );
};

export default ProfileCompletionBar;
