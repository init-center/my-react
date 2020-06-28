export default function createPortal(child, container) {
  child.isPortalComponent = true;
  child.portalContainer = container;
  return child;
}