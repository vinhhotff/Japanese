import React from 'react';
import '../styles/dragon-animation.css';

const DragonAnimation: React.FC = () => {
    return (
        <div className="dragon-container">
            {/* Single Dragon - Reverted to Version 1 style */}
            <div className="dragon-clip dragon-fly">
                <svg viewBox="0 0 200 60" xmlns="http://www.w3.org/2000/svg">
                    {/* Dragon Head */}
                    <path className="dragon-head-base" d="M180,30 Q195,20 200,30 Q195,40 180,30 M185,25 A2,2 0 1,1 187,25" />

                    {/* Body Segments (Slithering) */}
                    <path className="dragon-body dragon-animation-group seg-1" d="M165,30 Q172,20 180,30" />
                    <path className="dragon-body dragon-animation-group seg-2" d="M150,32 Q157,42 165,30" />
                    <path className="dragon-body dragon-animation-group seg-3" d="M135,30 Q142,20 150,32" />
                    <path className="dragon-body dragon-animation-group seg-4" d="M120,32 Q127,42 135,30" />
                    <path className="dragon-body dragon-animation-group seg-5" d="M105,30 Q112,20 120,32" />
                    <path className="dragon-body dragon-animation-group seg-6" d="M90,32 Q97,42 105,30" />
                    <path className="dragon-body dragon-animation-group seg-7" d="M75,30 Q82,20 90,32" />

                    {/* Tail */}
                    <path className="dragon-body dragon-animation-group seg-8" d="M40,30 Q60,30 75,30 L30,32 L40,30" />

                    {/* Fins/Details */}
                    <path fill="currentColor" opacity="0.4" d="M170,22 L175,15 L180,22 Z" className="dragon-animation-group seg-1" />
                    <path fill="currentColor" opacity="0.4" d="M155,40 L160,47 L165,40 Z" className="dragon-animation-group seg-2" />
                </svg>
            </div>
        </div>
    );
};

export default DragonAnimation;
