import { useEffect } from 'react';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import Ressources from '../components/Ressources.jsx';
import { useSections, useSettings } from '../contexts/ContentContext.jsx';

export default function RessourcesPage() {
  const sections = useSections();
  const settings = useSettings();
  const brand = settings?.brand?.name ?? 'Feed Your Head';
  // Hiding the section in the back office (eye icon) must hide the page content too.
  const section = sections.find((s) => s.type === 'ressources' && s.visible);

  useEffect(() => {
    document.title = `Ressources · ${brand}`;
  }, [brand]);

  return (
    <>
      <Nav />
      <main className="pt-16 md:pt-20 min-h-screen bg-cream">
        {section ? (
          <Ressources data={section.data} />
        ) : (
          <section className="bg-cream py-24 md:py-32">
            <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
              <span className="kicker">Ressources</span>
              <h1 className="mt-6 font-display font-medium text-forest text-4xl md:text-5xl">
                Bientôt disponible.
              </h1>
              <p className="mt-6 text-mute text-lg leading-relaxed">
                Cet espace accueillera prochainement des articles, retours d'expérience et contenus
                à explorer.
              </p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
