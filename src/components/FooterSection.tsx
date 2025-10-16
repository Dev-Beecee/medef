import Image from "next/image";

export default function FooterSection() {
    return (
        <section
            className="relative w-full overflow-hidden bg-cover bg-center"
            style={{
                backgroundImage: "url('/footer/seeph-FOOTER_2x.png')",
            }}
        >
            <div className="relative max-w-6xl mx-auto flex flex-col items-center justify-center text-center" style={{ padding: '100px 0 36px 0' }}>
                {/* Image centrale */}
                <Image
                    src="seeph-logo-nav.svg"
                    alt="Trophées des Entreprises et Administrations Inclusives de Martinique"
                    width={350}
                    height={164}
                    className="w-[150px] md:w-[350px]"
                />

                {/* Mentions légales alignées sur une seule ligne */}
                <div className="w-full text-[#DBB572] text-sm flex flex-col md:flex-row items-center justify-between px-6 mt-6">
                    {/* Copyright à gauche */}
                    <p className="text-left">© 2025 Tous droits réservés</p>

                    {/* Liens centrés */}
                    <div className="flex-1 flex justify-center gap-8">
                        <a href="#" className="hover:underline">
                            Politique de confidentialité
                        </a>
                        <a href="#" className="hover:underline">
                            Mentions légales
                        </a>
                    </div>

                    {/* Espace à droite pour équilibrer le flex */}
                    <div className="w-[180px]" />
                </div>

            </div>
        </section>
    );
}
