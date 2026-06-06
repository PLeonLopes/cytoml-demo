import Header from "./components/Header";
import Hero from "./components/Hero";
import UploadSection from "./components/UploadSection";
import GallerySection from "./components/GallerySection";
import AboutSection from "./components/AboutSection";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <Header />
      <main>
        <Hero />
        <UploadSection />
        <GallerySection />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;