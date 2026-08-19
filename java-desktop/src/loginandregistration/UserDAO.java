/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package loginandregistration;
import java.sql.*;
import java.util.ArrayList;
/**
 *
 * @author user
 */
public class UserDAO {
    public static ArrayList<User> getAllUsers() {
        ArrayList<User> list = new ArrayList<>();

        try {
            Connection con = DBConnection.getConnection();
            String query = "SELECT * FROM students";
            Statement st = con.createStatement();
            ResultSet rs = st.executeQuery(query);

            while (rs.next()) {
                User user = new User(
                        rs.getInt("u_id"),
                        rs.getString("u_fname"),
                        rs.getString("u_lname"),
                        rs.getString("u_username"),
                        rs.getString("u_email"),
                        rs.getString("u_depart"),
                        rs.getInt("u_sem"),
                        rs.getDouble("u_cgpa")
                );
                list.add(user);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }
    public static boolean updateUser(int u_id, String fname, String lname, String username,String email, String department, int sem, double gpa) {

    try {
        Connection con = DBConnection.getConnection();
        String query = "UPDATE students SET u_fname=?, u_lname=?, u_username=? , u_email=?, u_depart=?, u_sem=?, u_cgpa=? WHERE u_id=?";

        PreparedStatement ps = con.prepareStatement(query);
        ps.setString(1, fname);
        ps.setString(2, lname);
        ps.setString(3, username);
        ps.setString(4, email);
        ps.setString(5, department);
        ps.setInt(6, sem);
        ps.setDouble(7, gpa);
        ps.setInt(8, u_id);

        ps.executeUpdate();
        return true;

    } catch (Exception e) {
        e.printStackTrace();
        return false;
    }
}
    
    public static boolean deleteUser(int u_id) {

    try {
        Connection con = DBConnection.getConnection();
        String query = "DELETE FROM students WHERE u_id=?";

        PreparedStatement ps = con.prepareStatement(query);
        ps.setInt(1, u_id);

        ps.executeUpdate();
        return true;

    } catch (Exception e) {
        e.printStackTrace();
        return false;
    }
}
}
