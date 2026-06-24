// File: ops-footer.tsx — footer global del panel Zaire Ops (uso interno).
export default function OpsFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="zo-foot">
      <span className="zo-foot-tag">ZAIRE OPS · Panel operativo interno</span>
      <span>© {year} ZAIRE — Uso interno · Infraestructura para lo que viene.</span>
      <a href="mailto:hola@zairetech.com">hola@zairetech.com</a>
    </footer>
  );
}
