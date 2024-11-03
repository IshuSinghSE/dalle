import React, { useState, useEffect, useRef } from "react";
import { downloadIcon } from "../assets";
import { downloadImage } from "../utils";
import { DownloadIcon, Info, Copy } from "lucide-react"; // Import Lucid icons
import "../styles.css"; // Reference the styles.css file

// Cache the download icon
const cachedDownloadIcon = new Image();
cachedDownloadIcon.src = downloadIcon;

const Card = ({ _id, name, prompt, photo, lowRes, thumbnail }) => {
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const [lowResFullyLoaded, setLowResFullyLoaded] = useState(false);
  const lowResRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false); // State for tooltip visibility

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLowResLoaded(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (lowResRef.current) {
      observer.observe(lowResRef.current);
    }

    return () => {
      if (lowResRef.current) {
        observer.unobserve(lowResRef.current);
      }
    };
  }, []);

  const handleLowResLoad = () => {
    setLowResFullyLoaded(true);
  };

  return (
    <div className="rounded-xl group relative shadow-card hover:shadow-cardhover card image-hover">
      <img
        ref={lowResRef}
        className="w-full h-auto object-cover rounded-xl"
        src={thumbnail} // Load thumbnail version
        alt={prompt}
        // loading="lazy" // Lazy loading
      />
      {lowResLoaded && (
        <img
          className="w-full h-auto object-cover rounded-xl absolute top-0 left-0"
          src={lowRes} // Use WebP format
          alt={prompt}
          onLoad={handleLowResLoad}
          style={{ display: lowResFullyLoaded ? "block" : "none" }}
          // loading="lazy" // Lazy loading
        />
      )}
      <div className="flex-col justify-center absolute bottom-0 left-0 right-0 bg-[#10131f86] m-2 p-4 rounded-md backdrop-blur-lg hidden group-hover:flex">
        {/* <p className="text-white text-md overflow-y-auto prompt">{prompt}</p> */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full object-cover bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center text-white text-lg font-semibold">
              <p
                className=""
                style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)" }}
              >
                {name[0]}
              </p>
            </div>
            <p className="text-white text-md">{name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="relative icon-hover"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="w-6 h-6 text-white transition-transform transform hover:scale-105 will-change-transform backface-visibility-hidden" />
              {/* Use Lucid InfoCircle icon */}
              {showTooltip && (
                <div className="absolute bottom-3 left-3/4 transform -translate-x-3/4 mb-8 w-max max-w-xs bg-[#10131fde] backdrop-blur-lg text-white text-xs rounded-md p-2 opacity-100 transition-opacity backdrop-filter">
                  <p className="whitespace-pre-wrap break-words capitalize">
                    {prompt}
                  </p>
                  {/* Removed The Arrow Pointing To The Info Icon */}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => downloadImage(_id, photo)}
              className="outline-none bg-transparent border-none"
            >
              <DownloadIcon className="w-6 h-6 text-white transition-transform transform hover:scale-105 will-change-transform backface-visibility-hidden" />
              {/* Use Lucid Download icon */}
            </button>

            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(prompt)}
              className="outline-none bg-transparent border-none"
            >
              <Copy className="w-6 h-6 text-white transition-transform transform hover:scale-105 will-change-transform backface-visibility-hidden" />
              {/* Use Lucid Copy icon */}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
