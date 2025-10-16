import Image from "next/image";

export default function PartenairesSection() {
  return (
    <section
      className="w-full py-20"
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
        <div className="flex flex-wrap justify-center items-center gap-10">
          <Image
            src="/logo/mef.png"
            alt="Mouvement des Entreprises de France Martinique"
            width={160}
            height={80}
          style={{ height: '65px', width: 'auto' }}/>
          <Image
            src="/logo/france-travail.png"
            alt="France Travail"
            width={160}
            height={80}
          style={{ height: '65px', width: 'auto' }}/>
          <Image
            src="/logo/prefet.png"
            alt="Préfecture de la Martinique"
            width={120}
            height={80}
          style={{ height: '65px', width: 'auto' }}/>
          <Image
            src="/logo/fiphfp.png"
            alt="FIPHFP"
            width={140}
            height={80}
          style={{ height: '65px', width: 'auto' }}/>
          <Image
            src="/logo/agefiph.png"
            alt="Agefiph"
            width={140}
            height={80}
          style={{ height: '65px', width: 'auto' }}/>
          <Image
            src="/logo/prith.png"
            alt="PRITH Martinique"
            width={160}
            height={80}
          style={{ height: '65px', width: 'auto' }}/>
        </div>
      </div>
    </section>
  );
}
