import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from "../components/navbar";
import Footer from "../components/Footer";
    

const Home = () => {
  return (
    <div className="min-h-screen font-sans text-gray-700 bg-white">
      <Navbar />
      <section className="relative h-150 md:h-175 flex items-center ">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Stay Comfortably <br /> Like Your Home
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-lg">
              CareHome offers advanced, personalized care management tools designed to connect caregivers, families, and seniors for better safety and peace of mind.
            </p>
            <Link to="/signin">
              <button className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-semibold transition shadow-lg">
                Get in touch
              </button>
            </Link>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );
};

export default Home;
