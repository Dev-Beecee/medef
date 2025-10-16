import Image from "next/image";
import { BoutonParticipation } from "@/components/BoutonParticipation";

export default function EngagementSection() {
  return (
    <section
      className="w-full py-20"
      style={{
        backgroundColor: "#10214B",
        backgroundImage: "url('/seeph-bg-enparticipant_2x.png')",
        backgroundPosition: "50% 50%",
        backgroundSize: "cover",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
        
        {/* Titre principal */}
        <h2
          style={{
            color: "#DBB572",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            fontStyle: "bold",
            fontSize: "clamp(28px, 5vw, 40px)",
            lineHeight: "120%",
            letterSpacing: "0%",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          EN PARTICIPANT,<br></br> VOUS :
        </h2>

        {/* 4 points d'avantages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12" style={{ height: "auto", minHeight: "425px" }}>
          
          {/* Point 1 - Visibilité (image en haut) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4">
              <Image
                src="/seeph-eye.png"
                alt="Visibilité"
                width={64}
                height={64}
              />
            </div>
            <div
              className="p-6 rounded-[20px] text-white w-full max-w-sm"
              style={{
                borderRadius: "20px",
                border: "1px solid #DBB572",
                background: "rgba(219, 181, 114, 0.20)",
                backdropFilter: "blur(40px)",
                fontFamily: "Poppins, sans-serif",
                fontSize: "16px",
                lineHeight: "140%",
                textAlign: "center",
              }}
            >
              Donnez de la visibilité à vos actions concrètes en faveur de l&apos;inclusion.
            </div>
          </div>

          {/* Point 2 - Inspiration (contenu en bas) */}
          <div className="flex flex-col items-center space-y-4 md:justify-end">
            <div className="p-4">
              <Image
                src="/seeph-lightbulb-05.png"
                alt="Inspiration"
                width={64}
                height={64}
              />
            </div>
            <div
              className="p-6 rounded-[20px] text-white w-full max-w-sm"
              style={{
                borderRadius: "20px",
                border: "1px solid #DBB572",
                background: "rgba(219, 181, 114, 0.20)",
                backdropFilter: "blur(40px)",
                fontFamily: "Poppins, sans-serif",
                fontSize: "16px",
                lineHeight: "140%",
                textAlign: "center",
              }}
            >
              Inspirez d&apos;autres entreprises à s&apos;engager à leur tour.
            </div>
          </div>

          {/* Point 3 - Fédération (image en haut) */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4">
              <Image
                src="/seeph-users-02.png"
                alt="Fédération"
                width={64}
                height={64}
              />
            </div>
            <div
              className="p-6 rounded-[20px] text-white w-full max-w-sm"
              style={{
                borderRadius: "20px",
                border: "1px solid #DBB572",
                background: "rgba(219, 181, 114, 0.20)",
                backdropFilter: "blur(40px)",
                fontFamily: "Poppins, sans-serif",
                fontSize: "16px",
                lineHeight: "140%",
                textAlign: "center",
              }}
            >
              Fédérez vos collaborateurs autour d&apos;un projet porteur de sens.
            </div>
          </div>

          {/* Point 4 - Contribution (contenu en bas) */}
          <div className="flex flex-col items-center space-y-4 md:justify-end">
            <div className="p-4">
              <Image
                src="/seeph-heart-hand.png"
                alt="Contribution"
                width={64}
                height={64}
              />
            </div>
            <div
              className="p-6 rounded-[20px] text-white w-full max-w-sm"
              style={{
                borderRadius: "20px",
                border: "1px solid #DBB572",
                background: "rgba(219, 181, 114, 0.20)",
                backdropFilter: "blur(40px)",
                fontFamily: "Poppins, sans-serif",
                fontSize: "16px",
                lineHeight: "140%",
                textAlign: "center",
              }}
            >
              Et contribuez à changer le regard sur le handicap en Martinique.
            </div>
          </div>

        </div>

        {/* Section d'appel à l'action */}
        

      </div>

       <div
             className="py-8 px-6 md:px-12 mb-8 mt-24"
             style={{
               backgroundColor: "#DBB572",
               transform: "rotate(-2.145deg)",
             }}
          >
            <h3
              style={{
                color: "#10214B",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "clamp(20px, 4vw, 32px)",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              CANDIDATEZ, <span style={{ backgroundColor: "#10214B", color: "#DBB572", padding: "4px 8px", borderRadius: "8px" }}>PARTAGEZ</span>, INSPIREZ !
            </h3>
            </div>
           <div className="flex justify-center">
             <BoutonParticipation />
           </div>
    </section>
  );
}