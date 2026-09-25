import { Container, SectionHeading } from '../../../components/Section';

const STEPS = [
  'Encuentra a tu personaje favorito del multiverso de Marvel.',
  'Descubre su personalidad y los gustos musicales que la IA crea para él.',
  'Guarda su playlist y escucha las canciones en Spotify.',
];

const HowItWorks = () => (
  <section>
    <Container className="flex flex-col gap-4">
      <SectionHeading>¿Cómo funciona?</SectionHeading>

      <div className="grid gap-6 rounded-[40px] bg-primary p-6 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <article
            key={step}
            className="flex flex-col items-center gap-4 rounded-2xl bg-neutral p-6 text-center"
          >
            <h3 className="text-title2 text-success">{index + 1}.</h3>
            <p className="text-secondary text-primary">{step}</p>
          </article>
        ))}
      </div>
    </Container>
  </section>
);

export default HowItWorks;
