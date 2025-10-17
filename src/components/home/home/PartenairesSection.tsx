import Image from "next/image";

export default function PartenairesSection() {
  return (
    <section
      className="w-full py-20" id="partenaires"
      style={{
        backgroundColor: "#EBE7E1",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 text-center space-y-12">

        {/* Titre */}
        <h2
          style={{
            color: "#10214B",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            fontStyle: "bold",
            fontSize: "40px",
            lineHeight: "120%",
            letterSpacing: "0%",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          PARTENAIRES
        </h2>

        {/* Logos */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center md:items-center gap-6 md:gap-10">
          <div className="flex justify-center items-center">
            <Image
              src="/logo/mef.png"
              alt="Mouvement des Entreprises de France Martinique"
              width={160}
              height={80}
              style={{ height: '65px', width: 'auto' }}
            />
          </div>
          <div className="flex justify-center items-center">
            <Image
              src="/logo/france-travail.png"
              alt="France Travail"
              width={160}
              height={80}
              style={{ height: '65px', width: 'auto' }}
            />
          </div>
          <div className="flex justify-center items-center">
            <Image
              src="/logo/prefet.png"
              alt="Préfecture de la Martinique"
              width={120}
              height={100}
              style={{ height: '45px', width: 'auto' }}
            />
          </div>
          <div className="flex justify-center items-center">
            <Image
              src="/logo/fiphfp.png"
              alt="FIPHFP"
              width={140}
              height={80}
              style={{ height: '65px', width: 'auto' }}
            />
          </div>
          <div className="flex justify-center items-center">
            <Image
              src="/logo/agefiph.png"
              alt="Agefiph"
              width={140}
              height={80}
              style={{ height: '65px', width: 'auto' }}
            />
          </div>
          <div className="flex justify-center items-center">
            <Image
              src="/logo/prith.png"
              alt="PRITH Martinique"
              width={160}
              height={80}
              style={{ height: '65px', width: 'auto' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
