import { CalendarHeart } from "lucide-react";

export default function CalendrierSection() {
  return (
    <section className="w-full py-20 bg-white">
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
          CALENDRIER
        </h2>

        {/* Trois colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          
          {/* Étape 1 */}
          <div className="flex flex-col items-center space-y-4">
            <CalendarHeart size={48} color="#DBB572" />
            <h3
              style={{
                color: "#10214B",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: "130%",
              }}
            >
              2 novembre
            </h3>
            <p
              style={{
                color: "#10214B",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "150%",
              }}
            >
              Date limite de dépôt des candidatures.
            </p>
          </div>

          {/* Étape 2 */}
          <div className="flex flex-col items-center space-y-4">
            <CalendarHeart size={48} color="#DBB572" />
            <h3
              style={{
                color: "#10214B",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: "130%",
              }}
            >
              Du 3 au 13 novembre
            </h3>
            <p
              style={{
                color: "#10214B",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "150%",
              }}
            >
              Phase de vote.
            </p>
          </div>

          {/* Étape 3 */}
          <div className="flex flex-col items-center space-y-4">
            <CalendarHeart size={48} color="#DBB572" />
            <h3
              style={{
                color: "#10214B",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: "130%",
              }}
            >
              17 novembre
            </h3>
            <p
              style={{
                color: "#10214B",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "150%",
              }}
            >
              Remise des trophées.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
