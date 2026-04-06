/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  postMessage({
    type: 'not-implemented',
    payload: data
  });
});
