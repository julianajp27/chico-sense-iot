export default function LoadingState({
  message = "Carregando dados…",
}) {
  return (
    <div className ="feedback-state" role="status">
      <span
        className  ="feedback-state__spinner"
        aria-hidden="true"
      />
      <p className ="feedback-state__description">{message}
      </p>
    </div>
  );
}