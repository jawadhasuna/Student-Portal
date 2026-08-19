# Student Portal — the original Java desktop app

The version this project started as: a **Java Swing** application built in
NetBeans, talking to a local **MySQL** database. Kept here for reference. The
web port that replaced it lives in the repository root.

## What's here

```
src/loginandregistration/
  LoginAndRegistration.java   entry point
  LoginForm.java              login window
  RegisterForm.java           new student registration
  UserManagementForm.java     the student table: list, edit, delete
  User.java                   the student model
  UserDAO.java                getAllUsers / updateUser / deleteUser
  DBConnection.java           JDBC connection
  *.form                      NetBeans GUI Builder layouts

STUDENT.sql       the original MySQL schema
assets/           icons used by the UI
original-zips/    the archives this was extracted from
```

## Running it

Needs a JDK, NetBeans (or Ant) and a local MySQL server.

1. Create the database: run `STUDENT.sql` in MySQL.
2. Open the folder as a NetBeans project.
3. Add the MySQL Connector/J driver to the project's libraries.
4. Check the credentials in `DBConnection.java` match your local MySQL.
5. Run.

## Why it became a website

Swing draws native windows through the JVM. There's no build target, compiler
flag, or host that turns it into a web page — so the project had to be
**rebuilt** rather than deployed. The data model and the three `UserDAO`
operations carried over unchanged; two things deliberately did not.

**Passwords.** The schema stored them as `u_pass VARCHAR(20)` and login compared
them as plain text:

```java
con.prepareStatement("SELECT * FROM students WHERE u_username=? AND u_pass=?")
```

On your own machine that's a marked-down assignment. On a public website it's a
breach waiting to happen. The web version hands credentials to Supabase Auth,
which salts and hashes them.

**Authority.** `DBConnection.java` connects as the MySQL `root` user with the
password in the source, so every running copy had full control of the database
and could edit any student's row. The web version runs every query as the
signed-in user, with Row Level Security deciding what they may touch — which is
why Edit and Delete only appear on your own record there.

Those credentials are left in this archived copy on purpose: it's a snapshot of
the original, and the contrast is the point. They only ever pointed at
`localhost`, so there's nothing live behind them.

## What it did well

Every query used `PreparedStatement` with `?` placeholders, so the app was never
vulnerable to SQL injection — the thing student database projects most often get
wrong.
