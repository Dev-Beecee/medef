export default function CategoriesSection() {
  return (
    <section
      className="w-full py-20" id="categories"
      style={{
        background: "linear-gradient(180deg, #10214B 0%, #FFFFFF 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 text-center space-y-8">

        {/* Ligne 1 - Titre */}
        <h2
          style={{
            color: "#DBB572",
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
          CATÉGORIES
        </h2>

        {/* Ligne 2 - Sous-titre */}
        <p
          style={{
            color: "#EBE7E1",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 400,
            fontStyle: "normal",
            fontSize: "18px",
            lineHeight: "150%",
            letterSpacing: "0%",
            textAlign: "center",
          }}
          className="max-w-2xl mx-auto"
        >
          Les Trophées récompensent les structures engagées dans une ou <br /> plusieurs de ces catégories :
        </p>

        {/* Ligne 3 - 4 bulles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {/* Bulle 1 */}
          <div
            className="border border-[#DBB572] text-white p-6 rounded-[20px] shadow-md hover:shadow-lg transition"
            style={{
              backgroundColor: "#10214B",
              fontFamily: "Poppins, sans-serif",
              fontSize: "18px",
              lineHeight: "130%",
              letterSpacing: "0%",
              textAlign: "center",
            }}
          >
            <strong>Embauche</strong> d’un salarié/agent en situation de handicap.
          </div>

          {/* Bulle 2 */}
          <div
            className="border border-[#DBB572] text-white p-6 rounded-[20px] shadow-md hover:shadow-lg transition"
            style={{
              backgroundColor: "#10214B",
              fontFamily: "Poppins, sans-serif",
              fontSize: "18px",
              lineHeight: "130%",
              letterSpacing: "0%",
              textAlign: "center",
            }}
          >
            <strong>Maintien</strong> dans l’emploi d’un collaborateur en situation de handicap.
          </div>

          {/* Bulle 3 */}
          <div
            className="border border-[#DBB572] text-white p-6 rounded-[20px] shadow-md hover:shadow-lg transition"
            style={{
              backgroundColor: "#10214B",
              fontFamily: "Poppins, sans-serif",
              fontSize: "18px",
              lineHeight: "130%",
              letterSpacing: "0%",
              textAlign: "center",
            }}
          >
            <strong>Embauche</strong> en alternance d’une personne en situation de handicap.
          </div>

          {/* Bulle 4 */}
          <div
            className="border border-[#DBB572] text-white p-6 rounded-[20px] shadow-md hover:shadow-lg transition"
            style={{
              backgroundColor: "#10214B",
              fontFamily: "Poppins, sans-serif",
              fontSize: "18px",
              lineHeight: "130%",
              letterSpacing: "0%",
              textAlign: "center",
            }}
          >
            <strong>Collaboration</strong> avec une entreprise adaptée ou un ESAT.
          </div>
        </div>

      </div>
    </section>
  );
}
