/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package loginandregistration;

/**
 *
 * @author user
 */
public class User {
    private int id;
    private String fname;
    private String lname;
    private String username;
    private String email;
    private String department;
    private int sem;
    private double gpa;

    public User(int id, String fname, String lname, String username,String email, String department, int sem, double gpa) {
        this.id = id;
        this.fname = fname;
        this.lname = lname;
        this.username = username;
        this.email = email;
        this.department = department;
        this.sem = sem;
        this.gpa = gpa;
    }

    public int getId() {
        return id;
    }

    public String getFname() {
        return fname;
    }

    public String getLname() {
        return lname;
    }

    public String getUsername() {
        return username;
    }
    public String getEmail() { return email; }
    public String getDepartment() { return department; }
    public int getSem() { return sem; }
    public double getGpa() { return gpa; }
}
