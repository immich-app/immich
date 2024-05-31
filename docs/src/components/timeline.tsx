import useIsBrowser from '@docusaurus/useIsBrowser';
import { mdiCheckboxBlankCircle, mdiCheckboxMarkedCircle } from '@mdi/js';
import Icon from '@mdi/react';
import React from 'react';

export type Item = {
  icon: string;
  title: string;
  description?: string;
  link?: { url: string; text: string };
  done?: false;
  getDateLabel: (language: string) => string;
};

interface Props {
  items: Item[];
}

export function Timeline({ items }: Props): JSX.Element {
  const isBrowser = useIsBrowser();

  return (
    <ul className="flex flex-col pl-4">
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const done = item.done ?? true;
        const dateLabel = item.getDateLabel(isBrowser ? navigator.language : 'en-US');
        const timelineIcon = done ? mdiCheckboxMarkedCircle : mdiCheckboxBlankCircle;
        const cardIcon = item.icon;

        return (
          <li key={index} className={`flex min-h-24 w-[700px] max-w-[90vw] ${done ? '' : 'italic'}`}>
            <div className="md:flex justify-start w-36 mr-8 items-center dark:text-immich-dark-primary text-immich-primary hidden">
              {dateLabel}
            </div>
            <div className={`${isFirst && 'relative top-[50%]'} ${isLast && 'relative bottom-[50%]'}`}>
              <div
                className={`h-full border-solid border-4 border-immich-primary dark:border-immich-dark-primary ${
                  isFirst && 'rounded rounded-t-full'
                } ${isLast && 'rounded rounded-b-full'}`}
              ></div>
            </div>
            <div className="z-10 flex items-center bg-immich-primary dark:bg-immich-dark-primary border-2 border-solid rounded-full dark:text-black text-white relative top-[50%] left-[-3px] translate-y-[-50%] translate-x-[-50%] w-8 h-8 shadow-lg ">
              {<Icon path={timelineIcon} size={1.25} />}
            </div>
            <section className=" dark:bg-immich-dark-gray bg-immich-gray dark:border-0 border-gray-200 border border-solid rounded-2xl flex flex-row w-full gap-2 p-4 md:ml-4 my-2 hover:bg-immich-primary/10 dark:hover:bg-immich-dark-primary/10 transition-all">
              <div className="flex-col flex-grow items-center justify-between gap-2">
                <p className="m-0 mb-2 text-lg items-start flex gap-2">
                  <Icon path={cardIcon} size={1} />
                  <span>{item.title}</span>
                </p>
                <p className="m-0 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
              </div>
              <div className="flex flex-col justify-between place-items-end">
                <span className="dark:text-immich-dark-primary text-immich-primary">
                  {item.link && (
                    <a href={item.link.url} target="_blank" rel="noopener">
                      [{item.link.text}]
                    </a>
                  )}
                </span>
                <div className="md:hidden text-sm text-right">{dateLabel}</div>
              </div>
            </section>
          </li>
        );
      })}
    </ul>
  );
}
