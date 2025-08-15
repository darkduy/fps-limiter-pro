// support/release.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');

const releaseType = process.argv[2]; // Lấy loại release (patch, minor, major) từ dòng lệnh
if (!['patch', 'minor', 'major'].includes(releaseType)) {
  console.error('Lỗi: Vui lòng chỉ định loại release: patch, minor, hoặc major.');
  process.exit(1);
}

const packageJsonPath = path.resolve(__dirname, '../package.json');
const manifestJsonPath = path.resolve(__dirname, '../src/manifest.json');

try {
  // 1. Đọc và tăng phiên bản
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const oldVersion = packageJson.version;
  const newVersion = semver.inc(oldVersion, releaseType);

  console.log(`Đang nâng cấp phiên bản: ${oldVersion} -> ${newVersion}`);

  // 2. Cập nhật package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ Đã cập nhật package.json');

  // 3. Cập nhật manifest.json
  const manifestJson = JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8'));
  manifestJson.version = newVersion;
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifestJson, null, 2) + '\n');
  console.log('✅ Đã cập nhật manifest.json');

  // 4. Chạy các lệnh Git
  console.log('Đang thực thi các lệnh Git...');
  execSync('git add package.json src/manifest.json');
  execSync(`git commit -m "chore(release): Bump version to v${newVersion}"`);
  execSync(`git tag v${newVersion}`);
  execSync('git push');
  execSync('git push --tags');
  
  console.log(`🚀 Hoàn tất! Đã phát hành phiên bản v${newVersion}.`);
  console.log("GitHub Actions sẽ tự động build và tạo release mới.");

} catch (error) {
  console.error('Đã xảy ra lỗi trong quá trình release:', error.message);
  // Rollback các thay đổi nếu có lỗi
  execSync('git checkout -- package.json src/manifest.json');
  process.exit(1);
}
