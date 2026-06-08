export default function AboutSection() {
  const steps = [
    {
      number: "01",
      title: "Upload da Imagem",
      description:
        "O usuário envia a imagem do cariograma no formato JPG, PNG ou TIFF.",
    },
    {
      number: "02",
      title: "Processamento pelo Modelo",
      description:
        "O modelo YOLO realiza a detecção e classificação de cada cromossomo na imagem.",
    },
    {
      number: "03",
      title: "Análise e Classificação",
      description:
        "Os cromossomos são agrupados por pares e classificados conforme a nomenclatura citogenética.",
    },
    {
      number: "04",
      title: "Resultado",
      description:
        "O sistema exibe o laudo automático com os cromossomos detectados e o diagnóstico gerado.",
    },
  ];

  return (
    <section id="about" className="bg-[#f5f4f0] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Texto */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#1d5fa8]">
              Sobre o Projeto
            </p>
            <h2 className="mb-6 text-3xl font-bold text-[#1a1a1a]">
              Cariotipagem Automatizada com Visão Computacional
            </h2>
            <div className="space-y-4 text-[#6b6b6b]">
              <p className="leading-relaxed">
                O <span className="font-semibold text-[#1a1a1a]">CytoML</span>{" "}
                é um sistema desenvolvido como Trabalho de Conclusão de Curso
                que aplica técnicas de visão computacional para automatizar o
                processo de análise de cariogramas humanos.
              </p>
              <p className="leading-relaxed">
                Utilizando o modelo{" "}
                <span className="font-semibold text-[#1a1a1a]">YOLO</span>{" "}
                (You Only Look Once), o sistema é capaz de detectar imagens citogenéticas, reduzindo o
                tempo e a subjetividade do processo manual.
              </p>
              <p className="leading-relaxed">
                Essa demo foi desenvolvido em{" "}
                <span className="font-semibold text-[#1a1a1a]">
                  Django REST Framework
                </span>{" "}
                e a visualização em{" "}
                <span className="font-semibold text-[#1a1a1a]">
                  React + Vite
                </span>
                , compondo um sistema completo de ponta a ponta.
              </p>
            </div>
          </div>

          {/* Passos */}
          <div>
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-[#9e9e9e]">
              Como funciona
            </p>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f0fb] text-sm font-bold text-[#1d5fa8]">
                    {step.number}
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-[#1a1a1a]">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[#6b6b6b]">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Banner Saiba Mais */}
        <div className="mt-16 border-l-4 border-[#1d5fa8] bg-[#e8f0fb] rounded-r-2xl px-8 py-8 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#1d5fa8]">
              Cyto Compendium
            </p>
            <h3 className="text-xl font-bold text-[#1a1a1a]">
              Quer saber mais sobre o projeto?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[#6b6b6b]">
              Repositório público com artigos, repositórios e recursos relacionados à citogenética e visão computacional.
            </p>
          </div>
          <a
            href="https://pleonlopes.github.io/cyto-compendium/"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 rounded-md bg-[#1d5fa8] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#174d8a] active:scale-95"
          >
            Acessar site
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}