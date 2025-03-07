<p align="center"> 
  <br/>  
  <a href="https://opensource.org/license/agpl-v3"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg?color=3F51B5&style=for-the-badge&label=License&logoColor=000000&labelColor=ececec" alt="License: AGPLv3"></a>
  <a href="https://discord.immich.app">
    <img src="https://img.shields.io/discord/979116623879368755.svg?label=Discord&logo=Discord&style=for-the-badge&logoColor=000000&labelColor=ececec" alt="Discord"/>
  </a>
  <br/>  
  <br/>   
</p>

<p align="center">
<img src="/design/immich-logo-stacked-light.svg" width="300" title="Login With Custom URL">
</p>
<h3 align="center">Высокопроизводительное автономное решение для хранения и группировки фото и видео</h3>
<br/>
<a href="https://immich.app">
<img src="/design/immich-screenshots.png" title="Main Screenshot">
</a>
<br/>
<p align="center">
  <a href="../README.md">English</a>
  <a href="README_ca_ES.md">Català</a>
  <a href="README_es_ES.md">Español</a>
  <a href="README_fr_FR.md">Français</a>
  <a href="README_it_IT.md">Italiano</a>
  <a href="README_ja_JP.md">日本語</a>
  <a href="README_ko_KR.md">한국어</a>
  <a href="README_de_DE.md">Deutsch</a>
  <a href="README_nl_NL.md">Nederlands</a>
  <a href="README_tr_TR.md">Türkçe</a>
  <a href="README_zh_CN.md">中文</a>
  <a href="README_uk_UA.md">Українська</a>
  <a href="README_pt_BR.md">Português Brasileiro</a>
  <a href="README_sv_SE.md">Svenska</a>
  <br>
  <a href="README_ar_JO.md">العربية</a>
  <a href="README_vi_VN.md">Tiếng Việt</a>
  <a href="README_th_TH.md">ภาษาไทย</a>
</p>

## Предупреждение

- ⚠️ Этот проект находится **в очень активной** разработке.
- ⚠️ Ожидайте недоработки и глобальные изменения.
- ⚠️ **Не используйте это приложение как единственное хранилище своих фото и видео.**
- ⚠️ Всегда следуйте [плану резервного копирования «3-2-1»](https://www.backblaze.com/blog/the-3-2-1-backup-strategy/ "Стратегии резервного копирования: Почему стратегия резервного копирования «3-2-1» — лучшая") для ваших драгоценных фотографий и видео!


> [!NOTE]
> Инструкции по установке и документация по ссылке https://immich.app/

## Содержание

- [Официальная документация](https://immich.app/docs)
- [Введение](https://immich.app/docs/overview/introduction)
- [Установка](https://immich.app/docs/install/requirements)
- [План разработки](https://github.com/orgs/immich-app/projects/1)
- [Демо](#demo)
- [Возможности](#features)
- [Перевод](https://immich.app/docs/developer/translations)
- [Гид по участию и поддержке проекта](https://immich.app/docs/overview/support-the-project)

## Демо

Вы можете опробовать [Web демонстрационную версию](https://demo.immich.app/)

В мобильном приложении укажите `https://demo.immich.app` в поле `URL-адрес сервера`

### Данные для входа

| Email           | Пароль   |
| --------------- | -------- |
| demo@immich.app | demo     |

```
Характеристики демо-сервера: Free-tier Oracle VM - Amsterdam - 2.4Ghz quad-core ARM64 CPU, 24GB RAM
```

## Возможности

| Возможности                                            | Приложение | Веб |
| :----------------------------------------------------- | ---------- | --- |
| Загрузка, просмотр видео и фото                        | Да         | Да  |
| Автоматический бекап при запуске приложения            | Да         | Н/Д |
| Предотвращение дупликации данных                       | Да         | Да  |
| Выбор альбома (-ов) для бекапа                         | Да         | Н/Д |
| Скачивание фото и видео с сервера на устройство        | Да         | Да  |
| Поддержка нескольких аккаунтов пользователей           | Да         | Да  |
| Альбомы и общие альбомы                                | Да         | Да  |
| Прокручиваемая/перетаскиваемая полоса прокрутки        | Да         | Да  |
| Поддержка raw-форматов                                 | Да         | Да  |
| Просмотр метаданных (EXIF, map)                        | Да         | Да  |
| Поиск до метаданным, объектам, лицам и CLIP            | Да         | Да  |
| Функции администрирования (управление пользователями)  | Нет        | Да  |
| Фоновое резервное копирование                          | Да         | Н/Д |
| Виртуальная прокрутка                                  | Да         | Да  |
| Поддержка OAuth                                        | Да         | Да  |
| API Ключи                                              | Н/Д        | Да  |
| LivePhoto/MotionPhoto воспроизведение и бекап          | Да         | Да  |
| Отображение 360° изображений                           | Нет        | Да  |
| Настраиваемая структура хранилища                      | Да         | Да  |
| Общий доступ к контенту                                | Нет        | Да  |
| Архив и избранное                                      | Да         | Да  |
| Мировая карта                                          | Да         | Да  |
| Совместное использование                               | Да         | Да  |
| Распознавание и группировка по лицам                   | Да         | Да  |
| Воспоминания (в этот день x лет назад)                 | Да         | Да  |
| Работа без интернета                                   | Да         | Нет |
| Галереи только для просмотра                           | Да         | Да  |
| Коллажи                                                | Да         | Да  |
| Метки (теги)                                           | Нет        | Да  |
| Просмотр папкой                                        | Нет        | Да  |

## Перевод

Всё про перевод проекта [Здесь](https://immich.app/docs/developer/translations).

<a href="https://hosted.weblate.org/engage/immich/">
<img src="https://hosted.weblate.org/widget/immich/immich/multi-auto.svg" alt="Translation status" />
</a>

## Активность репозитория

![Activities](https://repobeats.axiom.co/api/embed/9e86d9dc3ddd137161f2f6d2e758d7863b1789cb.svg "Repobeats analytics image")

## История звёзд

<a href="https://star-history.com/#immich-app/immich&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=immich-app/immich&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=immich-app/immich&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=immich-app/immich&type=Date" width="100%" />
 </picture>
</a>

## Участники

<a href="https://github.com/alextran1502/immich/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=immich-app/immich" width="100%"/>
</a>
