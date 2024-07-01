import React, { useEffect, useState } from 'react';
import Head from '@docusaurus/core/lib/client/exports/Head';

export default function LinkPage(): JSX.Element {
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('rd');

  const [instanceUrl, setInstanceUrl] = useState(localStorage.getItem('immich-instance-url') || '');
  const [inputValue, setInputValue] = useState(instanceUrl);

  useEffect(() => {
    if (redirect && instanceUrl) {
      window.location.href = `${instanceUrl}/${redirect}`;
    }
  }, [redirect, instanceUrl]);

  useEffect(() => {
    localStorage.setItem('immich-instance-url', instanceUrl);
  }, [instanceUrl]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInstanceUrl(inputValue);
  };

  return (
    <>
      <Head>
        <title>My Immich</title>
      </Head>
      <div>
        <section className="my-8">
          <h1 className="md:text-6xl text-center mb-10 text-immich-primary dark:text-immich-dark-primary px-2">
            My Immich
          </h1>
          <p className="text-center text-xl px-2">
            My Immich allows public links to link you to specific areas of your personal Immich instance.
          </p>
          <div className="flex justify-around mt-8 w-full max-w-full">
            <form className="w-full max-w-sm" onSubmit={handleSubmit}>
              <div className="flex items-center border-b border-primary py-2">
                <input
                  className="appearance-none bg-transparent border-none w-full mr-3 py-1 px-2 leading-tight focus:outline-none"
                  type="text"
                  placeholder="https://demo.immich.app"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  aria-label="Instance URL"
                />
                <button
                  className="flex-shrink-0 bg-primary hover:bg-primary-dark border-primary hover:border-primary-dark text-sm border-4 text-white py-1 px-2 rounded"
                  type="submit"
                >
                  {redirect ? 'Save & Redirect' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
