/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package loginandregistration;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
/**
 *
 * @author user
 */
public class DBConnection {

    public static Connection getConnection() {
        Connection con = null;

        try {
            // 1. Load MySQL Driver
            Class.forName("com.mysql.cj.jdbc.Driver");

            // 2. Database URL (IMPORTANT FORMAT)
            String url = "jdbc:mysql://localhost:3306/STUDENT";
            String user = "root";
            String password = "1234";

            // 3. Create connection
            con = DriverManager.getConnection(url, user, password);
            System.out.println("✅ Database Connected Successfully");

        } catch (ClassNotFoundException e) {
            System.out.println("❌ MySQL Driver not found");
        } catch (SQLException e) {
            System.out.println("❌ Database connection failed");
            e.printStackTrace();
        }
        return con;
    }
}

        
