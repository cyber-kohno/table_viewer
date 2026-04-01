import type { RecordItem } from '../types';

const subsystems = ['販売', '会計', '在庫', '契約', '共通'];

export function createMockTableRecords(total = 1500): RecordItem[] {
  return Array.from({ length: total }, (_, index) => {
    const no = index + 1;
    const subsystem = subsystems[index % subsystems.length];
    return {
      subsystem,
      tableName: `T_${subsystem}_${String(no).padStart(4, '0')}`,
      logicalName: `${subsystem}管理テーブル ${no}`,
      columnCount: 8 + (index % 24)
    };
  });
}

export function createMockColumnRecords(total = 900): RecordItem[] {
  return Array.from({ length: total }, (_, index) => {
    const no = index + 1;
    const subsystem = subsystems[index % subsystems.length];
    const tableNo = Math.floor(index / 6) + 1;
    return {
      tableName: `T_${subsystem}_${String(tableNo).padStart(4, '0')}`,
      columnName: `COLUMN_${String(no).padStart(4, '0')}`,
      logicalName: `${subsystem}項目 ${no}`
    };
  });
}

export function createMockMessageRecords(total = 320): RecordItem[] {
  return Array.from({ length: total }, (_, index) => {
    const no = index + 1;
    return {
      messageKey: `MSG_${String(no).padStart(4, '0')}`,
      messageText: `ダミーメッセージ ${no} がここに入ります。`,
      sourceFile: `messages_${(index % 4) + 1}.properties`
    };
  });
}
