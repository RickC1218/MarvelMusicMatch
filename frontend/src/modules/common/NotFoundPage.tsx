import { Button } from '../../components/Button';
import { Container } from '../../components/Section';

const NotFoundPage = () => (
  <Container className="flex flex-col items-center gap-4 py-24 text-center">
    <h1 className="text-display font-semibold text-primary">404</h1>
    <p className="text-body text-muted">No encontramos esa página.</p>
    <Button label="Volver al inicio" variant="primary" icon="arrow-right" to="/" />
  </Container>
);

export default NotFoundPage;
