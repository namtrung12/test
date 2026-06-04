const fs = require('fs');
const cp = require('child_process');

const current = JSON.parse(fs.readFileSync('data/question-bank.json', 'utf8'));
const baseQuestions = current.questions.filter((question) => question.id.startsWith('phcn-q'));

const oldBank = JSON.parse(cp.execFileSync('git', ['show', 'HEAD:data/question-bank.json'], { encoding: 'utf8' }));
const staleDistractor = ['Số trang', 'bệnh', 'án.'].join(' ');
const restoredTextbookQuestions = oldBank.questions
  .filter((question) => question.id.startsWith('vltl-gt-q'))
  .map((question) => ({
    ...question,
    lesson: 2,
    options: Object.fromEntries(Object.entries(question.options).map(([key, value]) => [
      key,
      value.replace(staleDistractor, 'Số thứ tự hồ sơ điều trị.'),
    ])),
    explanation: question.explanation.replace('theo tài liệu nguồn đã cung cấp.', 'theo giáo trình phương thức vật lý trị liệu đã cung cấp.'),
  }));

const lessons = {
  1: 'Bộ 70 câu PHCN',
  2: 'Giáo trình phương thức VLTL - câu tổng hợp',
  3: 'Bài 1: Đại cương VLTL - PHCN',
  4: 'Bài 2: Tia hồng ngoại trị liệu',
  5: 'Bài 3: Tia tử ngoại trị liệu',
  6: 'Bài 4: Kỹ thuật điều trị bằng paraffin',
  7: 'Bài 5: Siêu âm trị liệu',
  8: 'Bài 6: Điện xung trị liệu',
  9: 'Bài 7: Dòng điện một chiều đều Ganvanic',
  10: 'Bài 8: Sóng ngắn trị liệu',
  11: 'Bài 9: Kéo giãn cột sống bằng máy kéo',
  12: 'Bài 10: Laser trong vật lý trị liệu',
  13: 'Bài 11: Từ trường trị liệu',
};

const rows = `
3|Theo giáo trình, vật lý trị liệu được hiểu đúng nhất là gì?|Dùng các biện pháp vật lý tác động lên cơ thể để điều trị, phục hồi chức năng và phòng bệnh.|Chỉ dùng thuốc để điều trị bệnh.|Chỉ phẫu thuật để phục hồi vận động.|Chỉ dùng tư vấn tâm lý cho người bệnh.|Bài đại cương định nghĩa vật lý trị liệu là dùng các tác nhân vật lý nhằm điều trị, phục hồi chức năng và phòng bệnh.
3|Mục tiêu của phục hồi chức năng là gì?|Giúp người tàn tật thực hiện tối đa chức năng, sống độc lập và hòa nhập xã hội.|Làm người bệnh phụ thuộc hoàn toàn vào bệnh viện.|Chỉ giảm đau tạm thời trong ngày điều trị.|Chỉ tập trung vào xét nghiệm chẩn đoán.|Giáo trình nêu phục hồi chức năng hướng đến độc lập tối đa, hòa nhập hoặc tái hòa nhập xã hội.
3|Nội dung nào là mục tiêu của phục hồi chức năng?|Ngăn ngừa bệnh tật thứ phát.|Tạo thêm thương tật thứ phát.|Không quan tâm chức năng nghề nghiệp.|Chỉ điều trị khi bệnh đã khỏi hoàn toàn.|Một mục tiêu được nêu rõ là ngăn ngừa bệnh tật thứ phát.
3|Ánh sáng trị liệu trong giáo trình chủ yếu dùng các tia nào?|Tia tử ngoại và tia hồng ngoại.|Tia X và tia gamma.|Sóng siêu âm và sóng radio.|Từ trường và dòng điện một chiều.|Bài 1 nêu ánh sáng trị liệu dùng tia tử ngoại và hồng ngoại để điều trị, phòng bệnh.
3|Tác dụng thường dùng của tia hồng ngoại trong bài đại cương là gì?|Tạo nhiệt bề mặt, giảm đau và chống viêm nông.|Tạo vitamin D là chính.|Kéo giãn rễ thần kinh.|Tạo co cơ tetany.|Giáo trình ghi tia hồng ngoại thường dùng tạo nhiệt bề mặt, giảm đau và chống viêm nông.
3|Tác dụng nổi bật của tia tử ngoại trong bài đại cương là gì?|Diệt khuẩn và kích thích tổng hợp vitamin D.|Tạo nhiệt sâu ở khớp háng.|Làm mềm sẹo bằng nhiệt giữ lâu.|Tăng sức cơ bằng xung điện.|Bài 1 nêu tia tử ngoại có tác dụng diệt khuẩn và kích thích tổng hợp vitamin D.
3|Cực âm trong điện trị liệu một chiều được ứng dụng để làm gì?|Giảm ngưỡng kích thích vận động, điều trị người bệnh liệt mềm.|Tăng ngưỡng kích thích vận động để gây liệt.|Chỉ dùng để giảm đau xương khớp.|Tạo sóng siêu âm ở đầu biến năng.|Giáo trình nêu cực âm giảm ngưỡng kích thích vận động nên dùng trong liệt mềm.
3|Nhiệt nóng trong nhiệt trị liệu gây tác dụng nào?|Giãn mạch, tăng tuần hoàn, giảm đau và giãn cơ.|Co mạch kéo dài và giảm tuần hoàn.|Làm lạnh mô sâu.|Chỉ gây tê da, không ảnh hưởng cơ.|Bài 1 mô tả nhiệt nóng gây giãn mạch, tăng tuần hoàn, giảm đau, giãn cơ.
3|Nhiệt lạnh trong nhiệt trị liệu có tác dụng chính nào?|Co mạch, giảm sưng và giảm đau cấp.|Giãn mạch mạnh, tăng tiết dịch.|Làm mềm sẹo bằng nhiệt sâu.|Tăng thân nhiệt toàn thân.|Giáo trình nêu nhiệt lạnh gây co mạch, giảm sưng và giảm đau cấp.
3|Hoạt động trị liệu được mô tả như thế nào?|Điều trị thể chất và tinh thần qua hoạt động có lựa chọn để đạt chức năng tối đa trong sinh hoạt.|Chỉ dùng thuốc an thần.|Chỉ chiếu tử ngoại toàn thân.|Chỉ tập luyện thể thao thành tích cao.|Bài 1 định nghĩa hoạt động trị liệu là điều trị qua các hoạt động có lựa chọn.
4|Bất kỳ vật nào có thể phát tia hồng ngoại?|Bất kỳ vật nóng nào.|Chỉ đèn hơi thủy ngân.|Chỉ vật có từ tính.|Chỉ vật ở nhiệt độ âm.|Giáo trình nêu bất kỳ vật nóng nào cũng phát ra tia hồng ngoại.
4|Vật càng nóng thì bước sóng bức xạ thay đổi thế nào?|Bước sóng càng ngắn.|Bước sóng càng dài vô hạn.|Bước sóng không đổi tuyệt đối.|Không còn phát bức xạ.|Bài 2 nêu vật càng nóng thì bước sóng bức xạ càng ngắn.
4|Tia hồng ngoại dài xuyên thấu qua da khoảng bao nhiêu?|Khoảng 2 mm và hấp thu trên mặt da.|Khoảng 5 - 10 cm.|Khoảng 30 mm.|Không hấp thu ở da.|Giáo trình mô tả tia hồng ngoại dài xuyên qua da 2 mm.
4|Tia hồng ngoại ngắn xuyên sâu khoảng bao nhiêu?|Khoảng 5 - 10 mm.|Khoảng 2 mm.|Khoảng 50 - 70 cm.|Không xuyên qua da.|Bài 2 nêu hồng ngoại ngắn xuyên sâu 5 - 10 mm.
4|Sự xâm nhập của tia hồng ngoại phụ thuộc chủ yếu vào yếu tố nào?|Bước sóng của bức xạ.|Màu áo bệnh nhân.|Số vòng dây cáp.|Cường độ từ trường trái đất.|Giáo trình nêu sự xâm nhập phụ thuộc bước sóng, bước sóng ngắn xuyên sâu hơn.
4|Tác dụng tại chỗ dễ thấy khi chiếu hồng ngoại là gì?|Giãn mạch ngoại biên gây đỏ da xung huyết.|Co mạch kéo dài làm da trắng.|Tạo phản ứng đỏ da sau 12 giờ do histamin.|Tạo co cơ tetany.|Bài 2 mô tả da ấm lên làm mạch ngoại biên giãn, gây đỏ da xung huyết.
4|Nóng nhẹ của hồng ngoại tác động lên đầu dây thần kinh cảm giác ra sao?|Làm dịu các đầu dây thần kinh thụ cảm.|Luôn gây đau dữ dội.|Làm mất vĩnh viễn cảm giác.|Không ảnh hưởng cảm giác.|Giáo trình nêu nóng nhẹ làm dịu đầu dây thần kinh thụ cảm.
4|Khoảng cách điều trị hồng ngoại trong quy trình là bao nhiêu?|Khoảng 50 cm từ đèn đến da.|2 - 2,5 cm.|5 - 10 mm.|1,5 cm.|Kỹ thuật hồng ngoại trong giáo trình yêu cầu đo khoảng cách đèn đến da 50 cm.
4|Tai biến táo bón khi chiếu hồng ngoại liên quan đến nguyên nhân nào?|Đổ mồ hôi mà không bù đủ nước.|Đeo kính bảo vệ mắt.|Đặt đèn đúng 50 cm.|Tắt đèn sau hết giờ.|Giáo trình nêu táo bón do bệnh nhân đổ mồ hôi mà không bù đủ nước.
4|Chống chỉ định của tia hồng ngoại gồm trường hợp nào?|Suy tim độ III, IV.|Đau cơ mạn tính ổn định.|Chuẩn bị trước tập vận động.|Vết thương cạn cần tăng tuần hoàn.|Bài 2 liệt kê suy tim độ III, IV là chống chỉ định.
5|Tác dụng sinh học chủ yếu của tia tử ngoại là gì?|Tác dụng hóa học.|Tác dụng nhiệt sâu.|Tác dụng kéo giãn cơ học.|Tác dụng từ trường.|Giáo trình phân biệt hồng ngoại chủ yếu do nhiệt, tử ngoại chủ yếu do hóa học.
5|Đèn tử ngoại trị liệu nhân tạo có hai loại chính nào?|Đèn hơi thủy ngân và đèn huỳnh quang.|Đèn LED trắng và đèn dây tóc.|Đèn laser và đèn halogen.|Đèn sóng ngắn và đèn vi sóng.|Bài 3 nêu hai loại chính là đèn hơi thủy ngân và đèn huỳnh quang.
5|Vỏ ống đèn hơi thủy ngân được làm bằng gì để không cản tia tử ngoại?|Thạch anh nóng chảy.|Nhựa PVC.|Gỗ cách điện.|Thép không gỉ.|Giáo trình nêu ống có vỏ bằng thạch anh nóng chảy.
5|Tỷ lệ tia tử ngoại trong quang phổ đặc hiệu của đèn hơi thủy ngân là bao nhiêu?|28%.|52%.|20%.|5%.|Bài 3 nêu tia tử ngoại chiếm 28% quang phổ.
5|Phản ứng đỏ da do tử ngoại thường xuất hiện khi nào?|Khoảng sau 12 giờ kể từ khi chiếu.|Ngay tức thì ở mọi liều.|Sau 3 tháng.|Trước khi chiếu.|Giáo trình nêu đỏ da thường xảy ra sau 12 giờ.
5|Đỏ da độ I được mô tả đúng nhất là gì?|Da đỏ nhẹ, không đau hay kích thích, mất dần trong 24 giờ.|Đỏ đậm, đau nhiều, phỏng nước.|Không đỏ nhưng mất cảm giác vĩnh viễn.|Đỏ rõ và kéo dài nhiều tháng.|Bài 3 mô tả đỏ da độ I là đỏ nhẹ và mất dần trong 24 giờ.
5|Đỏ da độ IV có đặc điểm nào?|Đỏ đậm, nóng, đau nhiều, phù nề kèm phỏng nước.|Đỏ nhẹ không đau.|Chỉ có cảm giác mát.|Không có phản ứng da.|Giáo trình mô tả đỏ da độ IV kèm đau nhiều và phỏng nước.
5|Tia tử ngoại tạo vitamin D nhờ biến đổi chất nào trong da?|7 dehydrocholesterol.|Hemoglobin.|Collagen.|Natri clorid.|Bài 3 nêu tia 270 - 310 nm biến 7 dehydrocholesterol thành vitamin D.
5|Liều đỏ da độ II được tính thế nào khi biết liều đỏ da độ I?|Gấp 2,5 lần liều đỏ da độ I.|Bằng 1/2 liều đỏ da độ I.|Gấp 10 lần liều đỏ da độ I.|Không liên quan liều độ I.|Giáo trình nêu liều đỏ da độ II gấp 2,5 lần độ I.
5|Xử trí viêm kết mạc do tử ngoại gồm nội dung nào?|Rửa mắt bằng axit boric, nhỏ Cloramphenicol 1% và đeo kính râm.|Chiếu thêm tử ngoại vào mắt.|Tăng thời gian chiếu lần sau.|Đắp paraffin lên mắt.|Bài 3 nêu xử trí viêm kết mạc bằng rửa mắt, nhỏ thuốc và đeo kính râm.
6|Paraffin dùng trong điều trị là loại nào?|Tinh khiết, trung tính, màu trắng, không độc.|Loại thô lẫn dầu đen.|Loại acid mạnh.|Loại kim loại nhiễm từ.|Giáo trình nêu paraffin điều trị là loại tinh khiết, trung tính, màu trắng, không độc.
6|Paraffin thường được pha thêm gì để tăng độ dẻo?|Một ít dầu paraffin.|Cồn khử mỡ.|Dung dịch axit boric.|Muối vàng.|Bài 4 nêu pha thêm dầu paraffin để tăng độ dẻo, tránh giòn gãy.
6|Phạm vi chỉ định của paraffin là gì?|Chỉ định tại chỗ, không có chỉ định toàn thân.|Chỉ định toàn thân là chính.|Chỉ dùng trong cấp cứu.|Chỉ dùng để chẩn đoán.|Giáo trình nêu paraffin chỉ có chỉ định tại chỗ.
6|Chỉ định của paraffin gồm nội dung nào?|Làm mềm sẹo.|Ổ viêm đã hóa mủ.|Khối u ác tính.|Vùng da có vết loét.|Bài 4 liệt kê làm mềm sẹo là chỉ định.
6|Chống chỉ định của paraffin gồm trường hợp nào?|Các ổ viêm đã hóa mủ.|Cần tăng tuần hoàn tại chỗ.|Giảm đau và giảm co rút cơ.|Sẹo không trợt loét cần làm mềm.|Giáo trình liệt kê ổ viêm hóa mủ là chống chỉ định.
6|Nhiệt độ nóng chảy của paraffin khoảng bao nhiêu?|52 - 53 độ C.|20 - 25 độ C.|80 - 100 độ C.|150 - 200 độ C.|Bài 4 nêu paraffin nóng chảy ở 52 - 53 độ C.
6|Khay paraffin thường có độ dày paraffin bao nhiêu?|1,5 - 2 cm.|0,1 - 0,2 cm.|5 - 10 cm.|10 - 15 cm.|Giáo trình nêu múc paraffin ra khay đủ dày 1,5 - 2 cm.
6|Thời gian đắp paraffin bằng miếng thường là bao lâu?|20 - 30 phút.|2 - 5 phút.|5 - 10 giây.|2 giờ liên tục.|Bài 4 nêu thời gian đắp 20 - 30 phút.
6|Nguyên nhân gây bỏng khi điều trị paraffin là gì?|Paraffin còn quá nóng hoặc có giọt nước trên bề mặt miếng paraffin.|Paraffin quá sạch và trung tính.|Giải thích kỹ cho bệnh nhân.|Đắp đúng thời gian.|Giáo trình cảnh báo bỏng khi nhiệt còn cao hoặc có nước trên bề mặt.
6|Biện pháp phòng hỏa hoạn khi dùng paraffin là gì?|Đun paraffin cách thủy và tránh để tràn khỏi nồi.|Đun trực tiếp trên lửa lớn.|Để paraffin tràn tự do.|Đặt gần nguồn lửa để giữ nóng.|Bài 4 nhấn mạnh paraffin dễ cháy nên cần đun cách thủy.
7|Sóng âm khác sóng điện từ ở điểm nào?|Sóng âm là sóng dọc truyền cùng hướng với phương truyền sóng.|Sóng âm là sóng ngang như ánh sáng.|Sóng âm truyền tốt trong chân không.|Sóng âm không cần môi trường vật chất.|Giáo trình nêu sóng âm là sóng dọc, khác sóng điện từ là sóng ngang.
7|Tai người nghe được âm thanh trong khoảng tần số nào?|20 đến 20.000 chu kỳ/giây.|1 đến 10 chu kỳ/giây.|500.000 đến 3.000.000 chu kỳ/giây.|13,6 đến 40,68 MHz.|Bài 5 nêu tai người nghe được khoảng 20 - 20.000 chu kỳ/giây.
7|Sóng siêu âm là sóng có tần số thế nào?|Lớn hơn 20.000 chu kỳ/giây.|Nhỏ hơn 20 chu kỳ/giây.|Đúng 50 Hz.|Luôn bằng 1 Hz.|Giáo trình định nghĩa siêu âm là sóng nén có tần số lớn hơn 20.000 chu kỳ/giây.
7|Tần số siêu âm dùng trong y học thường là bao nhiêu?|500.000 đến 3.000.000 chu kỳ/giây.|20 đến 2.000 chu kỳ/giây.|10 đến 150 Hz.|13,6 đến 40 Hz.|Bài 5 nêu siêu âm y học có tần số 500.000 - 3.000.000 chu kỳ/giây.
7|Khả năng siêu âm truyền qua môi trường được gọi là gì?|Âm trở.|Điện thẩm.|Từ thông.|Liều đỏ da.|Giáo trình gọi tính chất này là âm trở.
7|Sự phản xạ sóng siêu âm tuân theo quy luật nào?|Góc phản xạ bằng góc tới.|Góc phản xạ luôn bằng 0.|Góc phản xạ luôn lớn hơn 90 độ.|Không có quy luật.|Bài 5 nêu phản xạ tuân theo định luật quang hình học.
7|Khoảng cách mà cường độ siêu âm giảm còn một nửa gọi là gì?|Bán trị.|Biên độ.|Chu kỳ.|Điện cực.|Giáo trình định nghĩa khoảng cách cường độ giảm còn một nửa là bán trị.
7|Máy phát siêu âm tạo sóng nhờ hiện tượng nào?|Hiệu ứng áp lực điện của tinh thể thạch anh.|Phản ứng histamin.|Sức nổi của nước.|Từ trường hằng định.|Bài 5 nêu đầu biến năng dùng tinh thể thạch anh và hiệu ứng áp lực điện.
7|Vì sao cần môi trường trung gian giữa đầu biến năng và da?|Không khí có âm trở thấp làm siêu âm phản xạ gần như toàn bộ.|Để làm da khô hơn.|Để tạo tia tử ngoại.|Để tăng điện trở da.|Giáo trình giải thích siêu âm khó truyền trong không khí nên cần dầu, kem hoặc nước.
7|Trong điều trị siêu âm qua nước, đầu biến năng nên cách da khoảng bao nhiêu?|2 - 2,5 cm.|50 cm.|20 - 30 cm.|1 - 2 m.|Bài 5 nêu đầu biến năng cách mặt da 2 - 2,5 cm khi truyền trong nước.
8|Điện xung trị liệu là gì?|Dùng dòng điện không liên tục gồm các xung ngắn có chu kỳ phát xung - nghỉ.|Dùng dòng một chiều đều không đổi.|Dùng sóng âm tần số cao.|Dùng từ trường hằng định duy nhất.|Bài 6 định nghĩa điện xung là dòng không liên tục có chu kỳ phát xung - nghỉ.
8|Dạng xung nào không gây tích điện mô và an toàn cho điều trị dài?|Xung lưỡng pha.|Xung đơn pha.|Dòng Ganvanic.|Dòng acid dưới cực dương.|Giáo trình nêu xung lưỡng pha đảo chiều trong cùng một xung nên không gây tích điện mô.
8|Xung vuông có đặc điểm gì?|Tăng giảm biên độ gần như tức thì và kích thích mạnh.|Biên độ tăng rất từ từ.|Chỉ dùng để chiếu tử ngoại.|Không gây khử cực.|Bài 6 mô tả xung vuông có khả năng khử cực mạnh.
8|Xung tam giác phù hợp với trường hợp nào?|Người bệnh nhạy cảm hoặc vùng mô mềm tổn thương.|Đốt nốt ruồi.|Điện phân thuốc.|Thâu nhiệt sóng ngắn.|Giáo trình nêu xung tam giác tăng biên độ từ từ, giảm đau buốt.
8|Tần số 1 - 10 Hz trong điện xung dùng để làm gì?|Kích thích tiết endorphin, giảm đau mạn.|Giảm đau cấp theo TENS quy ước.|Tạo sóng siêu âm.|Tạo vitamin D.|Bảng tần số trong bài 6 nêu 1 - 10 Hz kích thích endorphin.
8|Tần số 20 - 60 Hz thường tạo tác dụng gì?|Co cơ tetany, tăng sức cơ.|Không tác dụng lên cơ.|Tạo phản ứng đỏ da độ IV.|Tạo nhiệt bằng sóng ngắn.|Giáo trình nêu 20 - 60 Hz tạo co cơ tetany.
8|Tần số 80 - 150 Hz trong TENS quy ước thường dùng cho mục tiêu nào?|Giảm đau cấp qua kích thích sợi A beta.|Kéo giãn cột sống.|Điện phân dẫn thuốc.|Tạo vitamin D.|Bài 6 nêu 80 - 150 Hz kích thích A beta để ức chế đau.
8|Pha trộn xung nhằm mục đích chính nào?|Tránh quen kích thích và tăng hiệu quả điều trị.|Tạo bỏng hóa học.|Làm mất hoàn toàn dòng điện.|Thay thế chống chỉ định.|Giáo trình nêu modulation giúp tránh quen kích thích.
8|Chống chỉ định tuyệt đối của điện xung là gì?|Người bệnh có máy tạo nhịp tim.|Đau cơ mạn tính.|Teo cơ do bất động.|Đau quanh khớp vai.|Bài 6 liệt kê pacemaker là chống chỉ định tuyệt đối.
8|Khi kết thúc điện xung cần làm gì trước khi tắt máy?|Giảm cường độ về 0.|Rút điện cực khi cường độ cao.|Đổi cực đột ngột.|Tăng tần số tối đa.|Giáo trình hướng dẫn giảm cường độ về 0 trước khi tắt máy.
9|Dòng Ganvanic là loại dòng điện nào?|Dòng điện một chiều đều, không đổi cường độ và chiều vận động điện tử.|Dòng xung phát - nghỉ.|Sóng điện từ cao tần.|Sóng âm tần số cao.|Bài 7 định nghĩa Ganvanic là dòng điện một chiều đều.
9|Vì sao dòng Ganvanic không phải dòng thấp tần?|Không biến thiên thành dạng sóng nên không xác định tần số.|Vì có tần số 80 - 150 Hz.|Vì là sóng siêu âm.|Vì tạo từ trường xoay chiều.|Giáo trình nêu Ganvanic không biến thiên dạng sóng.
9|Khi dòng Ganvanic qua cơ thể, cation đi về đâu?|Âm cực catot.|Dương cực anot.|Ra ngoài không khí.|Vào đầu biến năng siêu âm.|Bài 7 nêu ion dương đi về âm cực.
9|Anion trong điện trường Ganvanic đi về đâu?|Dương cực anot.|Âm cực catot.|Màng ngoài xương.|Tấm phản xạ nước.|Giáo trình nêu ion âm đi về dương cực.
9|Hiện tượng dòng Ganvanic ảnh hưởng đến thẩm thấu nước qua tế bào gọi là gì?|Điện thẩm.|Bán trị.|Gate Control.|Sinh hốc.|Bài 7 gọi hiện tượng này là điện thẩm.
9|Tác dụng vận mạch của Ganvanic là gì?|Co mạch ngắn rồi giãn mạch rõ dưới hai điện cực.|Chỉ co mạch vĩnh viễn.|Chỉ gây tắc mạch.|Không ảnh hưởng mạch máu.|Giáo trình nêu Ganvanic gây co mạch ngắn rồi giãn mạch rõ rệt.
9|Vật đệm dưới điện cực Ganvanic cần lớn hơn điện cực mỗi chiều bao nhiêu?|1 - 2 cm.|0,1 mm.|10 cm.|50 cm.|Bài 7 nêu vật đệm dài hơn điện cực mỗi chiều 1 - 2 cm.
9|Cường độ dòng Ganvanic cho phép theo diện tích điện cực là bao nhiêu?|0,2 mA/cm2 điện cực.|3 W/cm2.|100 mT.|80 - 150 Hz.|Giáo trình nêu cường độ cho phép là 0,2 mA/cm2 điện cực.
9|Điện phân dẫn thuốc là gì?|Đưa thuốc vào cơ thể bằng dòng điện một chiều.|Đưa sóng siêu âm qua nước.|Đưa ánh sáng laser vào mắt.|Đưa lực kéo vào cột sống.|Bài 7 định nghĩa điện phân dẫn thuốc là đưa thuốc bằng dòng một chiều.
9|Chống chỉ định của dòng Ganvanic gồm trường hợp nào?|Viêm da hoặc chàm các loại.|Đau thần kinh cần giảm đau.|Viêm mạn tính phù hợp.|Cần điện phân thuốc tại chỗ.|Giáo trình liệt kê viêm da và chàm là chống chỉ định.
10|Điều trị bằng dòng cao tần còn gọi là gì?|Thâu nhiệt trị liệu.|Điện phân dẫn thuốc.|Hoạt động trị liệu.|Kéo tự trọng.|Bài 8 nêu dòng cao tần sinh nhiệt nên gọi là thâu nhiệt trị liệu.
10|Dòng cao tần không kích thích thần kinh vì sao?|Thời gian tác dụng quá ngắn để kích thích thần kinh.|Vì là dòng một chiều đều.|Vì không tạo nhiệt.|Vì chỉ tạo histamin.|Giáo trình giải thích tần số cao làm thời gian tác dụng quá ngắn.
10|Dòng cao tần có ưu điểm nào so với dòng một chiều?|Không gây bỏng hóa học vì là dòng xoay chiều.|Luôn gây bỏng acid ở cực dương.|Luôn gây tích điện mô.|Không thể tạo nhiệt.|Bài 8 nêu dòng cao tần là xoay chiều nên không gây bỏng hóa học.
10|Trong phương pháp điện trường tụ điện, hai điện cực đóng vai trò gì?|Hai bản cực của tụ điện.|Hai đầu biến năng siêu âm.|Hai nam châm vĩnh cửu.|Hai thước đo liều tử ngoại.|Giáo trình mô tả hai điện cực là hai bản cực tụ điện.
10|Tác dụng chính của thâu nhiệt sóng ngắn là gì?|Tạo nhiệt trong mô.|Tạo vitamin D.|Làm lạnh mô.|Đưa thuốc ion vào da.|Bài 8 nêu tác dụng chính là tạo nhiệt trong mô.
10|Điện cực sóng ngắn nên đặt thế nào với mặt da?|Song song với mặt da để điện trường hướng vào vùng điều trị.|Đặt lệch góc để tạo mũi nhọn.|Chạm sát da không cần khoảng cách.|Đặt lên vùng ẩm ướt.|Giáo trình nêu đặt song song để tránh tập trung điện trường.
10|Khi thử sóng ngắn bằng dây cáp có thể dùng dụng cụ nào?|Ống neon.|Thước đo liều sinh lý.|Cốc từ hóa nước.|Dao cắt paraffin.|Bài 8 nêu thử dòng cảm ứng bằng ống neon.
10|Vì sao vùng trị liệu sóng ngắn phải khô?|Ẩm ướt hấp thụ nhiệt nhanh và có thể gây bỏng.|Nước làm tăng vitamin D.|Da khô làm mất mọi cảm giác.|Chỉ vùng ẩm mới điều trị được.|Giáo trình cảnh báo hơi ẩm hấp thụ nhiệt nhanh làm da nóng.
10|Liều lượng sóng ngắn chủ yếu dựa vào yếu tố nào?|Cảm giác nhiệt của người bệnh.|Màu sắc điện cực.|Số lượng nam châm.|Số thứ tự bài học.|Bài 8 nêu liều dựa vào cảm giác nhiệt vì ampe kế không cho biết mức nóng mô.
10|Chống chỉ định của thâu nhiệt sóng ngắn gồm trường hợp nào?|Nguy cơ chảy máu hoặc cảm giác không bình thường.|Viêm mạn tính ổn định.|Đau mạn tính cần liều nóng nhẹ.|Cần tăng tuần hoàn mô sâu đúng chỉ định.|Giáo trình nêu không dùng khi nguy cơ chảy máu hoặc cảm giác không bình thường.
11|Kéo giãn cột sống được định nghĩa như thế nào?|Áp dụng lực cơ học theo hướng tách mặt khớp và kéo dài mô mềm xung quanh.|Dùng tia tử ngoại tạo đỏ da.|Dùng điện xung kích thích cơ.|Dùng paraffin làm nóng sẹo.|Bài 9 định nghĩa kéo giãn là áp dụng lực cơ học để tách mặt khớp và kéo dài mô mềm.
11|Tác dụng đầu tiên của kéo giãn trong đau cột sống là gì?|Gây giãn cơ thụ động, giảm co cứng và cắt vòng xoáy đau.|Tạo phỏng nước.|Tăng co cứng phản xạ.|Giảm chiều cao khoang đốt.|Giáo trình nêu kéo làm giãn cơ thụ động và giảm co cứng cơ.
11|Nếu tăng giảm lực kéo quá nhanh có thể gây gì?|Kích thích làm tăng co cơ.|Tạo vitamin D.|Làm mất mọi cảm giác.|Gây đỏ da do histamin.|Bài 9 cảnh báo tăng giảm lực quá nhanh có thể làm tăng co cơ.
11|Lực kéo dọc cột sống có thể làm khoang đốt cao thêm trung bình bao nhiêu?|Khoảng 1,1 mm.|Khoảng 10 cm.|Khoảng 0,01 mm.|Không thay đổi.|Giáo trình nêu khoang đốt có thể cao thêm trung bình 1,1 mm.
11|Kéo liên tục là chế độ như thế nào?|Lực kéo tác động liên tục và không thay đổi trong suốt quá trình kéo.|Lực kéo luôn bằng 0.|Lực kéo thay đổi không có nền.|Chỉ dùng trọng lượng nước.|Bài 9 định nghĩa kéo liên tục là lực không đổi trong suốt quá trình kéo.
11|Kéo ngắt quãng phù hợp với trường hợp nào?|Đau mạn tính với co cứng cơ không đáng kể.|Gãy xẹp lún đốt sống.|Ung thư cột sống.|Lao cột sống tiến triển.|Giáo trình nêu kéo ngắt quãng dùng cho đau mạn tính khi co cứng không đáng kể.
11|Chỉ định kéo giãn cột sống gồm trường hợp nào?|Thoát vị đĩa đệm cổ hoặc thắt lưng mức độ nhẹ và vừa.|Ung thư cột sống.|Lao cột sống tiến triển.|Loãng xương nặng.|Bài 9 liệt kê thoát vị đĩa đệm nhẹ và vừa là chỉ định.
11|Chống chỉ định tuyệt đối của kéo giãn gồm trường hợp nào?|Gãy, xẹp lún hoặc trượt thân đốt sống.|Đau cổ gáy mạn tính phù hợp.|Thoái hóa cột sống nhẹ.|Cong vẹo cột sống không cấu trúc.|Giáo trình liệt kê chấn thương gãy, xẹp lún, trượt thân đốt sống là chống chỉ định tuyệt đối.
11|Lực nền khi kéo cột sống thắt lưng khoảng bao nhiêu trọng lượng cơ thể?|50 - 55%.|Không quá 10%.|100%.|5%.|Bài 9 nêu lực nền kéo thắt lưng bằng 50 - 55% trọng lượng cơ thể.
11|Sau kéo giãn cột sống, bệnh nhân cần nghỉ tại chỗ bao lâu?|10 - 15 phút.|Không cần nghỉ.|1 - 2 phút là tối đa.|3 giờ bắt buộc.|Giáo trình yêu cầu nằm nghỉ tại chỗ 10 - 15 phút sau kéo.
12|Laser là viết tắt của cụm nào?|Light Amplification by Stimulated Emission of Radiation.|Low Amplitude Sound Electric Radiation.|Linear Acoustic Soft Energy Response.|Long Active Static Electric Reflex.|Giáo trình giải thích laser là khuếch đại ánh sáng bằng phát xạ kích thích.
12|Tính chất nổi bật của chùm tia laser là gì?|Đồng nhất bước sóng và độ phân kỳ rất nhỏ.|Bước sóng hỗn loạn.|Luôn tạo nhiệt nông mạnh.|Không phải bức xạ điện từ.|Bài 10 nêu laser có tính đồng nhất bước sóng và phân kỳ rất nhỏ.
12|Laser helium-neon trong thiết bị điều trị tạo ánh sáng đỏ bước sóng khoảng bao nhiêu?|630 nm.|904 nm.|2000 nm.|20 m.|Giáo trình nêu laser helium-neon tạo ánh sáng đỏ 630 nm.
12|Laser hồng ngoại trong thiết bị phối hợp có bước sóng khoảng bao nhiêu?|904 nm.|630 nm.|315 nm.|27,2 MHz.|Bài 10 nêu laser hồng ngoại có bước sóng 904 nm.
12|Độ xuyên thấu hữu dụng của laser hồng ngoại có thể lên đến bao nhiêu?|30 mm.|2 mm.|5 - 10 mm.|50 - 70 cm.|Giáo trình nêu laser hồng ngoại có thể xuyên thấu hữu dụng đến 30 mm.
12|Laser năng lượng cao thường dùng cho mục đích nào?|Ngoại khoa hoặc phá hủy.|Điều trị da nông là chính.|Đo liều tử ngoại.|Kéo giãn cột sống.|Bài 10 phân loại laser năng lượng cao dùng cho ngoại khoa hoặc phá hủy.
12|Loại laser nào được kỹ thuật viên vật lý trị liệu sử dụng theo giáo trình?|Laser trung gian.|Laser năng lượng cao ngoại khoa.|Laser phá hủy.|Đèn hơi thủy ngân.|Giáo trình nêu laser trung gian được kỹ thuật viên VLTL sử dụng.
12|Khi điều trị laser, chùm tia nên tiếp xúc với da ở góc nào?|Thẳng góc với mặt da, góc tới 0 độ.|Góc 45 độ luôn tốt nhất.|Song song mặt da.|Bất kỳ góc nào cũng như nhau.|Bài 10 nêu góc tới 0 độ giúp không giảm độ xuyên thấu.
12|Hiệu quả điều trị chính được nêu của laser là gì?|Giảm đau và gia tăng tiến trình lành thương.|Gây bỏng hóa học.|Tạo co cơ tetany.|Giảm áp lực đĩa đệm bằng lực kéo.|Giáo trình nêu laser có hiệu quả giảm đau và tăng lành thương.
12|Nguyên tắc an toàn mắt khi điều trị laser là gì?|Kỹ thuật viên và bệnh nhân phải mang kính bảo vệ mắt.|Chỉ cần bệnh nhân nhắm mắt.|Chiếu thử trực tiếp vào mắt.|Tắt hết đèn phòng.|Bài 10 yêu cầu cả kỹ thuật viên và bệnh nhân mang kính bảo vệ mắt.
13|Thành tựu tiêu biểu của ứng dụng từ trường trong chẩn đoán là gì?|Ghi hình ảnh cộng hưởng từ MRI.|Đo liều sinh lý tử ngoại.|Điện phân dẫn thuốc.|Kéo giãn bằng bàn dốc.|Bài 11 nêu MRI là thành tựu tiêu biểu của từ trường trong chẩn đoán.
13|Theo giáo trình, quả đất được xem như gì?|Một nam châm khổng lồ sinh ra từ trường xung quanh.|Một nguồn tử ngoại duy nhất.|Một đầu biến năng siêu âm.|Một điện cực Ganvanic.|Giáo trình nêu trái đất là nam châm khổng lồ.
13|Tác dụng từ trường lên cơ thể có tính chất nào?|Tác động đồng thời lên nhiều chức năng, chủ yếu với rối loạn hệ thống và thoái hóa.|Đặc hiệu tuyệt đối với mọi bệnh cấp.|Chỉ phá hủy mô.|Chỉ gây mê.|Bài 11 nêu từ trường có tác dụng kết hợp và không đặc hiệu với bệnh cấp.
13|Từ trường tác động đến thành phần kim loại nào được nhấn mạnh?|Sắt trong hồng cầu và màng xương.|Iod trong tuyến giáp duy nhất.|Canxi trong nước bọt duy nhất.|Natri trong mồ hôi duy nhất.|Giáo trình nêu từ trường tác động đến thành phần kim loại, đặc biệt là sắt.
13|Cường độ từ trường trị liệu dùng ngoài thường trong phạm vi nào?|10 - 150 mT.|0,1 - 0,5 W/cm2.|80 - 150 Hz.|20 - 30 phút ở 80 độ C.|Bài 11 nêu cường độ dùng ngoài thường trong phạm vi 10 - 150 mT.
13|Tác dụng của từ trường gồm nội dung nào?|Giảm đau, chống viêm, giảm phù nề và kích thích can xương.|Tạo đỏ da độ IV là chính.|Gây bỏng hóa học.|Làm tăng áp lực nội đĩa đệm.|Giáo trình liệt kê giảm đau, chống viêm, giảm phù nề, kích thích can xương.
13|Chống chỉ định của từ trường trị liệu gồm trường hợp nào?|Người mang máy tạo nhịp.|Đau thoái hóa mạn tính đúng chỉ định.|Cần kích thích can xương.|Rối loạn chức năng không cấp tính.|Bài 11 liệt kê người mang máy tạo nhịp là chống chỉ định.
13|Cường độ từ trường tại đầu phát có thể điều biến trong khoảng nào?|10 - 100 mT.|1 - 10 Hz.|3 W/cm2.|52 - 53 độ C.|Giáo trình nêu cường độ tại đầu phát có thể điều biến 10 - 100 mT.
13|Thời gian mỗi lần từ trị liệu dùng ngoài thường là bao lâu?|15 - 30 phút.|2 - 5 giây.|5 - 10 giờ.|24 giờ liên tục bằng máy.|Bài 11 nêu mỗi lần điều trị từ trường 15 - 30 phút.
13|Cần tránh để thiết bị nào tiếp xúc với từ trường điều trị?|Đồng hồ và la bàn.|Khăn khô.|Băng dính y tế.|Vải phủ nhựa trung tính.|Giáo trình nêu đồng hồ, la bàn có thể sai lệch khi tiếp xúc từ trường.
`.trim();

function parseRow(line, index) {
  const parts = line.split('|');
  if (parts.length !== 7) {
    throw new Error(`Invalid row ${index + 1}: expected 7 fields, received ${parts.length}`);
  }

  const [lesson, question, correct, wrong1, wrong2, wrong3, explanation] = parts;
  return {
    id: `vltl-gt-extra-q${index + 1}`,
    lesson: Number(lesson),
    type: 'mcq',
    question,
    options: {
      A: correct,
      B: wrong1,
      C: wrong2,
      D: wrong3,
    },
    answer: 'A',
    explanation,
  };
}

const extraQuestions = rows.split('\n').map(parseRow);
const questions = [...baseQuestions, ...restoredTextbookQuestions, ...extraQuestions];

const seen = new Set();
for (const question of questions) {
  if (seen.has(question.id)) {
    throw new Error(`Duplicate question id: ${question.id}`);
  }
  seen.add(question.id);
  if (!question.options || !(question.answer in question.options)) {
    throw new Error(`Invalid answer for ${question.id}`);
  }
  if (!lessons[question.lesson]) {
    throw new Error(`Missing lesson title for ${question.id}`);
  }
}

const output = {
  title: 'Bộ câu hỏi PHCN và giáo trình phương thức VLTL',
  source: 'Bo_70_Cau_Hoi_PHCN.docx; giáo trình phương thức vltl 30.11.25.docx',
  lessons,
  questions,
};

fs.writeFileSync('data/question-bank.json', JSON.stringify(output, null, 2) + '\n', 'utf8');

function phpString(value) {
  return "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function phpValue(value, level) {
  const indent = '    '.repeat(level);
  const child = '    '.repeat(level + 1);

  if (Array.isArray(value)) {
    if (!value.length) {
      return '[]';
    }
    return '[\n' + value.map((item) => child + phpValue(item, level + 1) + ',').join('\n') + '\n' + indent + ']';
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (!entries.length) {
      return '[]';
    }
    return '[\n' + entries.map(([key, item]) => {
      const phpKey = /^(0|[1-9][0-9]*)$/.test(key) ? key : phpString(key);
      return child + phpKey + ' => ' + phpValue(item, level + 1) + ',';
    }).join('\n') + '\n' + indent + ']';
  }

  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value === null) {
    return 'null';
  }
  return phpString(value);
}

fs.writeFileSync('data/question_bank.php', '<?php\n\nreturn ' + phpValue(output, 0) + ';\n', 'utf8');

console.log(JSON.stringify({
  base: baseQuestions.length,
  restoredTextbook: restoredTextbookQuestions.length,
  extraTextbook: extraQuestions.length,
  total: questions.length,
}, null, 2));
