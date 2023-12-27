# Access database (GUI)

:::note
in order to connect to the database the immich_postgres container **must be on**.
:::

:::info
Password and username match the ones specified in the `.env` file. If you have changed these values, **they must be changed accordingly in the Connection screen** as explained below
:::

- The software must be installed [pgAdmin](https://www.pgadmin.org/download)
- Open pgAdmin and select the add new server option

  <img src={require('./img/add-new-server-option.png').default} width="50%" title="new server option" />
- enter a value for `name` (can be any name you want)
- in Connection we will enter the following details:


| Details                                                                                                                                                                                 |                                         Final Result                                         |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------: |
| Host name/address =`Local host`<br />Port = `5432`<br />Maintenance database = `immich`<br />Username = `postgres`<br />Password = `postgres`<br /><br /><br /><br /><br /><br /><br /> | <img src={require('./img/Connection-Pgadmin.png').default} width="75%" title="Connection" /> |

* click on Save to connect to the Immich database

now you have access to the Immich database.

:::tip
follow [Database Queries](https://immich.app/docs/guides/database-queries/) guide for more information
:::

# EXTRA

---

if you want to be able to use pgAdmin in your brwoser you can follow this steps

* In pgAdmin click on file --> runtime --> view log

  <img src={require('./img/view-log.png').default} width="30%" title="view log" />
* The link will appear there with a unique key (which changes every time you reconnect to pgAdmin) through which you can enter the GUI in the browser

<img src={require('./img/unique-key.png').default} width="50%" title="new server option" />
