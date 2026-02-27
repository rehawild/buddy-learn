import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import buddyImg from "@/assets/buddy-owl.png";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-lg space-y-8 fade-up">
        <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden buddy-glow">
          <img src={buddyImg} alt="Study Buddy owl mascot" className="w-full h-full object-cover" />
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Study <span className="text-primary">Buddy</span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            A friendly mascot that keeps you engaged during lessons with quick micro-interactions.
          </p>
        </div>

        <button
          onClick={() => navigate("/present")}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
        >
          <Play className="w-5 h-5" />
          Start Demo
        </button>

        <p className="text-xs text-muted-foreground">
          Choose from 2 built-in lessons · STEM & Humanities
        </p>
      </div>
    </div>
  );
}
