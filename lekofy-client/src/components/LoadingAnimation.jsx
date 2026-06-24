import './LoadingAnimation.css';

function LoadingAnimation({
  message = 'Загрузка...',
  hint = 'Подготавливаем контент',
  fullScreen = false,
  className = '',
}) {
  const classes = ['lekofy-loader', fullScreen ? 'lekofy-loader--full' : 'lekofy-loader--inline', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status" aria-live="polite" aria-label={message}>
      <div className="lekofy-loader__frame" aria-hidden="true">
        <div className="lekofy-loader__halo" />
        <video
          className="lekofy-loader__video"
          src="/animations/lekofy-bounce-loading.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
      </div>

      <div className="lekofy-loader__copy">
        <strong className="lekofy-loader__title">{message}</strong>
        {hint ? <span className="lekofy-loader__hint">{hint}</span> : null}
      </div>

      <div className="lekofy-loader__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default LoadingAnimation;
