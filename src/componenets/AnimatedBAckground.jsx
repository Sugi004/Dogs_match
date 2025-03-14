import { useEffect } from "react";
import gsap from "gsap";

const AnimatedBackground = () => {
  useEffect(() => {
    gsap.to("body", {
      background: "linear-gradient(135deg, #ff9a9e, #fad0c4, #ffdde1, #ff9a9e)",
      duration: 5,
      repeat: -1,
      yoyo: true,
    });
  }, []);

  return null; // This component only runs animations
};

export default AnimatedBackground;
