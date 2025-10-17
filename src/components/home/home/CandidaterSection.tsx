import Image from "next/image";

export default function CandidaterSection() {
  return (
    <section className="w-full py-20 bg-white" id="candidature">
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
          COMMENT CANDIDATER ?
        </h2>

        {/* Étapes */}
        <div className="flex flex-col md:flex-row items-start justify-center gap-8 relative">

          {/* Étape 1 */}
          <div
            className="flex flex-col items-center text-white p-8 rounded-[20px] w-full md:w-1/3"
            style={{
              backgroundColor: "#10214B",
              fontFamily: "Poppins, sans-serif",
              fontSize: "18px",
              lineHeight: "130%",
              textAlign: "center",
            }}
          >
            <div className="text-4xl mb-4 font-bold">1</div>
            <p style={{paddingBottom : "15px"}}>Choisir la ou les <br /> catégories qui vous <br /> correspondent.</p>
          </div>

          {/* Flèche 1 */}
          <div className="hidden md:flex items-center justify-center pt-10">
            <Image
              src="/Union.svg"
              alt=""
              width={114}
              height={48}
              style={{ position: "absolute", top: "200px" }}
            />
          </div>

          {/* Étape 2 */}
          <div
            className="flex flex-col items-center text-[#10214B] p-8 rounded-[20px] w-full md:w-1/3"
            style={{
              backgroundColor: "#DBB572",
              fontFamily: "Poppins, sans-serif",
              fontSize: "18px",
              lineHeight: "130%",
              textAlign: "center",
            }}
          >
            <div className="text-4xl mb-4 font-bold">2</div>
            <p>Remplir le formulaire et signer les documents.</p>
          </div>

          {/* Flèche 2 */}
          <div className="hidden md:flex items-center justify-center pt-10">
            <Image
              src="/Union.svg"
              alt=""
              width={114}
              height={48}
              style={{ position: "absolute", top: "181px" , left: "660px"} }
            />
          </div>

          {/* Étape 3 */}
          <div
            className="flex flex-col items-center text-white p-8 rounded-[20px] w-full md:w-1/3"
            style={{
              backgroundColor: "#10214B",
              fontFamily: "Poppins, sans-serif",
              fontSize: "18px",
              lineHeight: "130%",
              textAlign: "center",
            }}
          >
            <div className="text-4xl mb-4 font-bold">3</div>
            <p>
              Envoyer une vidéo* <br /> expliquant comment <br /> vous avez inclus la <br />
              dimension du handicap <br />au sein de votre <br />structure.
            </p>
            <p className="text-[#DBB572] mt-2 text-sm font-normal">
              *Format portrait | mp4 | 2 min
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
