import Button from "./Button";

export default function ErrorState({
  message  = "Não foi possível carregar os dados.",
  onRetry,
  loading  = false,
}) {
  return (
    <div className    ="feedback-state">
      <div role       ="alert">
        <h3 className ="feedback-state__title">
          Não foi possível concluir
        </h3>

        <p className  ="feedback-state__description">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className ="feedback-state__action">
          <Button
            variant    ="secondary"
            onClick    ={onRetry}
            loading    ={loading}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}