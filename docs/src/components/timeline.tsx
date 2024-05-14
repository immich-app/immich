import React from 'react';
import Icon from '@mdi/react';
import { mdiCheckboxMarkedCircleOutline } from '@mdi/js';
import useIsBrowser from '@docusaurus/useIsBrowser';

export interface Item {
  icon: string;
  title: string;
  description?: string;
  release?: string;
  tag?: string;
  date: Date;
  dateType: DateType;
}

export enum DateType {
  RELEASE = 'Release Date',
  DATE = 'Date',
}

interface Props {
  items: Item[];
}

export default function Timeline({ items }: Props): JSX.Element {
  const isBrowser = useIsBrowser();

  return (
    <ul className="flex flex-col pl-4">
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        const classNames: string[] = [];

        if (isFirst) {
          classNames.push('');
        }

        if (isLast) {
          classNames.push('rounded rounded-b-full');
        }

        return (
          <li key={index} className="flex min-h-24 w-[700px] max-w-[90vw]">
            <div className="md:flex justify-start w-36 mr-8 items-center dark:text-immich-dark-primary text-immich-primary hidden">
              {isBrowser ? item.date.toLocaleDateString(navigator.language) : ''}
            </div>
            <div className={`${isFirst && 'relative top-[50%]'} ${isLast && 'relative bottom-[50%]'}`}>
              <div
                className={`h-full border-solid border-4 border-immich-primary dark:border-immich-dark-primary ${
                  isFirst && 'rounded rounded-t-full'
                } ${isLast && 'rounded rounded-b-full'}`}
              ></div>
            </div>
            <div className="z-10 flex items-center bg-immich-primary dark:bg-immich-dark-primary border-2 border-solid rounded-full dark:text-black text-white relative top-[50%] left-[-3px] translate-y-[-50%] translate-x-[-50%] w-8 h-8 shadow-lg ">
              <Icon path={mdiCheckboxMarkedCircleOutline} size={1.25} />
            </div>
            <section className=" dark:bg-immich-dark-gray bg-immich-gray dark:border-0 border-gray-200 border border-solid rounded-2xl flex flex-col w-full gap-2 p-4 md:ml-4 my-2 hover:bg-immich-primary/10 dark:hover:bg-immich-dark-primary/10 transition-all">
              <div className="m-0 text-lg flex w-full items-center justify-between gap-2">
                <p className="m-0 items-start flex gap-2">
                  <Icon path={item.icon} size={1} />
                  <span>{item.title}</span>
                </p>

                <span className="dark:text-immich-dark-primary text-immich-primary">
                  {item.tag ? (
                    <a
                      href={`https://github.com/immich-app/immich/releases/tag/${item.tag}`}
                      target="_blank"
                      rel="noopener"
                    >
                      [{item.release ?? item.tag}]{' '}
                    </a>
                  ) : (
                    item.release && <span>[{item.release}]</span>
                  )}
                </span>
              </div>
              <div className="md:hidden text-xs">
                {`${item.dateType} - ${isBrowser ? item.date.toLocaleDateString(navigator.language) : ''}`}
              </div>
              <p className="m-0 text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
            </section>
          </li>
        );
      })}
    </ul>
  );
}
