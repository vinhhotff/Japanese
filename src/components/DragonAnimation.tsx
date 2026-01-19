import React from 'react';
import '../styles/dragon-animation.css';

const DragonAnimation: React.FC = () => {
    return (
        <div className="dragon-container">
            {/* Single Large Dragon */}
            <div className="dragon-clip dragon-fly">
                <svg viewBox="0 0 250 100" xmlns="http://www.w3.org/2000/svg">
                    {/* Dragon Head - Detailed with eyes and mouth */}
                    <g className="dragon-animation-group seg-1">
                        {/* Main Head Shape */}
                        <path className="dragon-head-base" d="M190,45 Q210,30 230,45 L235,55 Q220,70 190,60 L190,45" />

                        {/* Mouth */}
                        <path className="dragon-mouth" d="M210,55 Q220,60 230,55" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />

                        {/* Eye Background */}
                        <circle cx="215" cy="45" r="4" fill="white" className="dragon-feature" />
                        {/* Eye Pupil */}
                        <circle cx="217" cy="45" r="1.5" fill="black" className="dragon-eye" />

                        {/* Whiskers */}
                        <path d="M225,48 Q240,40 250,45" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" className="dragon-body" />
                        <path d="M225,52 Q240,65 250,60" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" className="dragon-body" />

                        {/* Horns */}
                        <path d="M205,38 L210,25" stroke="currentColor" strokeWidth="2" className="dragon-body" />
                        <path d="M195,40 L190,28" stroke="currentColor" strokeWidth="2" className="dragon-body" />
                    </g>

                    {/* Body Segments (Slithering) */}
                    <path className="dragon-body dragon-animation-group seg-2" d="M170,50 Q180,35 190,50" />
                    <path className="dragon-body dragon-animation-group seg-3" d="M150,55 Q160,70 170,50" />
                    <path className="dragon-body dragon-animation-group seg-4" d="M130,50 Q140,35 150,55" />
                    <path className="dragon-body dragon-animation-group seg-5" d="M110,55 Q120,70 130,50" />
                    <path className="dragon-body dragon-animation-group seg-6" d="M90,50 Q100,35 110,55" />
                    <path className="dragon-body dragon-animation-group seg-7" d="M70,55 Q80,70 90,50" />

                    {/* Tail */}
                    <path className="dragon-body dragon-animation-group seg-8" d="M30,50 Q50,50 70,55 L20,58 L30,50" />

                    {/* Decorative Fins */}
                    <path fill="currentColor" opacity="0.4" d="M180,38 L185,28 L190,38 Z" className="dragon-animation-group seg-1" />
                    <path fill="currentColor" opacity="0.4" d="M160,65 L165,75 L170,65 Z" className="dragon-animation-group seg-2" />
                </svg>
            </div>
        </div>
    );
};

export default DragonAnimation;
