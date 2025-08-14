const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      fullname: 'Admin User',
      password: hashedPassword,
      role: 'admin'
    }
  });

  const employeePassword = await bcrypt.hash('employee123', 10);
  
  // Create multiple employees with departments
  const employees = [
    {
      email: 'john.doe@test.com',
      fullname: 'John Doe',
      department: 'IT',
      phone: '081234567890',
      nationality: 'Indonesian'
    },
    {
      email: 'jane.smith@test.com',
      fullname: 'Jane Smith',
      department: 'HR',
      phone: '081234567891',
      nationality: 'Indonesian'
    },
    {
      email: 'mike.johnson@test.com',
      fullname: 'Mike Johnson',
      department: 'Finance',
      phone: '081234567892',
      nationality: 'Indonesian'
    },
    {
      email: 'sarah.wilson@test.com',
      fullname: 'Sarah Wilson',
      department: 'Marketing',
      phone: '081234567893',
      nationality: 'Indonesian'
    },
    {
      email: 'david.brown@test.com',
      fullname: 'David Brown',
      department: 'Operations',
      phone: '081234567894',
      nationality: 'Indonesian'
    }
  ];

  for (const emp of employees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        fullname: emp.fullname,
        password: employeePassword,
        role: 'employee',
        department: emp.department,
        phone: emp.phone,
        nationality: emp.nationality
      }
    });
  }

  console.log('Seeding completed!');
  console.log('Admin credentials: admin@test.com / admin123');
  console.log('Employee credentials: employee123 for all employees');
  console.log('Created employees:', employees.map(e => `${e.fullname} (${e.email})`).join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });