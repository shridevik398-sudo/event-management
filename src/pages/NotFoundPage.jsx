import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen aurora-bg flex items-center justify-center text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-8xl"
        >
          🗺️
        </motion.div>
        <div>
          <h1 className="text-8xl font-extrabold text-white opacity-30">404</h1>
          <h2 className="text-3xl font-extrabold text-white -mt-4">Page Not Found</h2>
          <p className="text-white/70 mt-3 text-lg">Looks like this page wandered off. Let's get you back!</p>
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="glass" size="lg" icon={ArrowLeft} onClick={() => window.history.back()}>Go Back</Button>
          <Link to="/">
            <Button className="bg-white text-slate-900 hover:bg-slate-100" size="lg" icon={Home}>Home</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
