import database, models

def reset():
    db_gen = database.get_db()
    db = next(db_gen)
    
    confirm = input("Bạn có chắc chắn muốn XÓA SẠCH dữ liệu không? (y/n): ")
    if confirm.lower() == 'y':
        # Xóa dữ liệu trong bảng transactions
        db.query(models.Transaction).delete()
        
        # Nếu muốn xóa cả user thì bỏ comment dòng dưới
        # db.query(models.User).delete()
        
        db.commit()
        print("--- Đã xóa sạch dữ liệu thử nghiệm thành công! ---")
    else:
        print("--- Đã hủy lệnh reset. ---")

if __name__ == "__main__":
    reset()