import React, { useEffect, useState } from 'react';
import Head from '@docusaurus/core/lib/client/exports/Head';

export default function LinkPage(): JSX.Element {
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('rd');

  const [instanceUrl, setInstanceUrl] = useState(localStorage.getItem('immich-instance-url') || '');
  const [inputValue, setInputValue] = useState(instanceUrl);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (redirect && instanceUrl) {
      window.location.href = new URL(redirect, instanceUrl).toString();
    }
  }, [redirect, instanceUrl]);

  useEffect(() => {
    localStorage.setItem('immich-instance-url', instanceUrl);
  }, [instanceUrl]);

  const handleChange = (value: string) => {
    setInputValue(value);
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInstanceUrl(inputValue);
    setSaved(true);
  };

  return (
    <>
      <Head>
        <title>My Immich</title>
      </Head>
      <div className="w-screen h-screen bg-immich-dark-bg overflow-auto p-4">
        <div className="mx-auto max-w-screen-sm m-6 p-12 border rounded-[50px] bg-immich-dark-gray text-immich-dark-fg">
          <section className="text-center">
            <img src="img/immich-logo-stacked-dark.svg" className="h-64" alt="Immich logo" />
          </section>
          <section>
            <h1 className="md:text-3xl mb-2 text-immich-dark-primary">My Immich</h1>
            <p>My Immich allows public links to link you to specific areas of your personal Immich instance.</p>
            <form onSubmit={handleSubmit}>
              <label id="instance-url-label" htmlFor="instance-url-input" className="font-medium immich-dark-fg">
                Instance URL
              </label>
              <div className="flex gap-2">
                <input
                  id="instance-url-input"
                  aria-labelledby="instance-url-label"
                  className="flex-grow rounded-xl px-3 py-3 text-sm bg-gray-600 text-immich-dark-fg border-none outline-none"
                  type="text"
                  placeholder="https://demo.immich.com/"
                  value={inputValue}
                  onChange={(e) => handleChange(e.target.value)}
                  aria-label="Instance URL"
                />
              </div>
              <p className="mt-2 text-sm">Note: This URL is only stored in your browser.</p>
              <div className="flex justify-end">
                {saved ? (
                  <p className="text-center sm:text-right m-0 px-5 py-3 text-sm text-immich-dark-primary">Saved!</p>
                ) : (
                  <button
                    className="cursor-pointer w-full sm:w-auto border-0 text-white rounded-xl px-5 py-3 items-center justify-center bg-immich-primary hover:bg-immich-primary/80"
                    type="submit"
                  >
                    {redirect ? 'Save & Redirect' : 'Save'}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
