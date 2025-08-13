// .eslint-rules/no-console-log.js

module.exports = {
  // Thông tin về quy tắc
  meta: {
    type: "problem", // Loại quy tắc: problem, suggestion, layout
    docs: {
      description: "Cấm sử dụng console.log trong mã nguồn",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code", // Quy tắc này có thể tự động sửa lỗi
    schema: [] // Không có tùy chọn cấu hình
  },
  // Hàm tạo ra quy tắc
  create: function(context) {
    return {
      // "Visitor" sẽ được gọi mỗi khi gặp một CallExpression (lời gọi hàm)
      CallExpression(node) {
        // Kiểm tra xem có phải là console.log không
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.name === 'console' &&
          node.callee.property.name === 'log'
        ) {
          // Báo cáo lỗi tại vị trí của node
          context.report({
            node: node,
            message: "Không được sử dụng console.log.",
            // Hàm sửa lỗi: thay thế `console.log(...)` bằng `// console.log(...)`
            fix(fixer) {
              return fixer.insertTextBefore(node, '// ');
            }
          });
        }
      },
    };
  },
};
