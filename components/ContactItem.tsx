import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface ContactItemProps {
  contact: string;
  index: number;
  onDelete: (index: number) => void;
  onEdit: (index: number, newValue: string) => void;
}

export default function ContactItem({
  contact,
  index,
  onDelete,
  onEdit,
}: ContactItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(contact);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      Alert.alert('Invalid', 'Phone number cannot be empty.');
      return;
    }
    onEdit(index, trimmed);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(contact);
    setEditing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="person" size={16} color={Colors.primary} />
      </View>

      {editing ? (
        <View style={styles.editRow}>
          <TextInput
            style={styles.input}
            value={editValue}
            onChangeText={setEditValue}
            keyboardType="phone-pad"
            autoFocus
            selectionColor={Colors.primary}
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Ionicons name="close" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.displayRow}>
          <Text style={styles.contactText}>{contact}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setEditing(true)}
            >
              <Ionicons name="pencil" size={15} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() =>
                Alert.alert(
                  'Delete Contact',
                  `Remove ${contact}?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDelete(index),
                    },
                  ]
                )
              }
            >
              <Ionicons name="trash" size={15} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  displayRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  deleteBtn: {
    backgroundColor: Colors.primary + '18',
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 2,
  },
  saveBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.safe,
  },
  cancelBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
