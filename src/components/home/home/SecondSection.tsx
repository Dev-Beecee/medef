import React from 'react';

const SecondSection: React.FC = () => {
  return (
    <section className="py-16 px-4 w-full  " id="second-section" style={{
      backgroundColor: "#10214B",
    }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Colonne gauche - Titre */}
          <div className="text-center lg:text-left">
            <h2 
              className="text-4xl lg:text-5xl font-bold uppercase leading-tight"
              style={{
                color: '#DBB572',
                fontFamily: 'Poppins',
                fontSize: '40px',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            >
              Et si votre engagement faisait la différence ?
            </h2>
          </div>

          {/* Colonne droite - Description */}
          <div className="text-center lg:text-left">
            <p 
              className="text-lg leading-relaxed"
              style={{
                color: '#EBE7E1',
                fontFamily: 'Poppins',
                fontSize: '18px',
                fontWeight: 400
              }}
            >
              Les Trophées des Administrations et Entreprises Inclusives de Martinique c&apos;est un concours qui met à l&apos;honneur structures engagées pour l&apos;inclusion des personnes en situation de handicap, qu&apos;il s&apos;agisse d&apos;emploi, d&apos;aménagements de postes ou de démarches d&apos;accompagnement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecondSection;
