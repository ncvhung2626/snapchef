import React, { useMemo, useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { createRecipe } from '../services/postService';
import { RECIPE_CATEGORIES } from '../constants/categories';
import { PrimaryButton } from '../components/PrimaryButton';
import { validateRecipeDraft, hasErrors } from '../utils/validation';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { radius } from '../theme/radius';
import { useRecipeStore } from '../store/recipeStore';
import { invalidateFeedQueries } from '../utils/invalidateFeed';

export const CreateRecipeScreen = ({ navigation }: RootStackScreenProps<'CreateRecipe'>) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const setDraft = useRecipeStore((s) => s.setDraft);
  const clearDraft = useRecipeStore((s) => s.clearDraft);
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('healthy');
  const [cookTime, setCookTime] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted draft once — do not subscribe to draft (avoids store↔state loop).
  useEffect(() => {
    const saved = useRecipeStore.getState().draft;
    if (saved) {
      setTitle(saved.title);
      setDescription(saved.description);
      setCategory(saved.category);
      setCookTime(saved.cookTimeMinutes ? String(saved.cookTimeMinutes) : '');
      setIngredients(saved.ingredients.length ? saved.ingredients : ['']);
      setSteps(saved.steps.length ? saved.steps : ['']);
      setImageUri(saved.imageUri ?? null);
    }
    setHydrated(true);
  }, []);

  // One-way sync: local fields → store only.
  useEffect(() => {
    if (!hydrated) return;
    if (!title && !description) {
      clearDraft();
      return;
    }
    setDraft({
      title,
      description,
      category,
      ingredients,
      steps,
      cookTimeMinutes: cookTime ? parseInt(cookTime, 10) : undefined,
      imageUri: imageUri ?? undefined,
      updatedAt: new Date().toISOString(),
    });
  }, [title, description, category, cookTime, ingredients, steps, imageUri, setDraft, clearDraft, hydrated]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền thư viện ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const updateList = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    const next = [...list];
    next[index] = value;
    setList(next);
  };

  const addRow = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList([...list, '']);
  };

  const removeRow = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step === 0) {
      const e: Record<string, string> = {};
      if (!title.trim()) e.title = 'Nhập tên món';
      if (!description.trim()) e.description = 'Nhập mô tả';
      setErrors(e);
      if (hasErrors(e)) return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const handlePublish = async () => {
    const e = validateRecipeDraft({
      title,
      description,
      ingredients,
      steps,
    });
    setErrors(e);
    if (hasErrors(e) || !user) return;

    setSubmitting(true);
    try {
      await createRecipe(user._id, {
        title,
        description,
        category,
        ingredients,
        steps,
        cookTimeMinutes: cookTime ? parseInt(cookTime, 10) : undefined,
        imageUri: imageUri ?? undefined,
      });
      clearDraft();
      setTitle('');
      setDescription('');
      setIngredients(['']);
      setSteps(['']);
      setImageUri(null);
      invalidateFeedQueries();
      Alert.alert('Thành công', 'Đã đăng công thức', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err instanceof Error ? err.message : 'Không đăng được');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo công thức ({step + 1}/3)</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progress}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 0 && (
          <>
            <Text style={styles.label}>Tên món *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Gà nướng mật ong"
            />
            {errors.title && <Text style={styles.err}>{errors.title}</Text>}

            <Text style={styles.label}>Mô tả ngắn *</Text>
            <TextInput
              style={[styles.input, styles.area]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Giới thiệu món ăn..."
            />
            {errors.description && <Text style={styles.err}>{errors.description}</Text>}

            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.catRow}>
              {RECIPE_CATEGORIES.filter((c) => c.key !== 'all').map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, category === c.key && styles.catChipOn]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={[styles.catText, category === c.key && styles.catTextOn]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Thời gian (phút)</Text>
            <TextInput
              style={styles.input}
              value={cookTime}
              onChangeText={setCookTime}
              keyboardType="number-pad"
              placeholder="30"
            />

            <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} />
              ) : (
                <>
                  <Feather name="camera" size={32} color={colors.primary} />
                  <Text style={styles.uploadHint}>Thêm ảnh món</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.label}>Nguyên liệu *</Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.listRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={ing}
                  onChangeText={(v) => updateList(ingredients, setIngredients, i, v)}
                  placeholder={`Nguyên liệu ${i + 1}`}
                />
                <TouchableOpacity onPress={() => removeRow(ingredients, setIngredients, i)}>
                  <Feather name="minus-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {errors.ingredients && <Text style={styles.err}>{errors.ingredients}</Text>}
            <TouchableOpacity onPress={() => addRow(ingredients, setIngredients)}>
              <Text style={styles.addLink}>+ Thêm nguyên liệu</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.label}>Các bước nấu *</Text>
            {steps.map((st, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={st}
                  onChangeText={(v) => updateList(steps, setSteps, i, v)}
                  placeholder={`Bước ${i + 1}`}
                  multiline
                />
                <TouchableOpacity onPress={() => removeRow(steps, setSteps, i)}>
                  <Feather name="minus-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            {errors.steps && <Text style={styles.err}>{errors.steps}</Text>}
            <TouchableOpacity onPress={() => addRow(steps, setSteps)}>
              <Text style={styles.addLink}>+ Thêm bước</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < 2 ? (
          <PrimaryButton label="Tiếp tục" onPress={nextStep} />
        ) : (
          <PrimaryButton label="Đăng công thức" onPress={handlePublish} loading={submitting} />
        )}
      </View>
    </SafeAreaView>
  );
};

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: { ...typography.headlineMd, color: colors.onSurface },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceVariant,
  },
  dotActive: { backgroundColor: colors.primary },
  scroll: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  label: { ...typography.labelMd, color: colors.onSurface, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  area: { minHeight: 90, textAlignVertical: 'top' },
  err: { ...typography.bodyMd, color: colors.error, marginTop: spacing.xs },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  catChipOn: { backgroundColor: colors.primary },
  catText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  catTextOn: { color: colors.onPrimary },
  imageBox: {
    height: 160,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  uploadHint: { ...typography.bodyMd, color: colors.primary, marginTop: spacing.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  stepNum: { ...typography.labelMd, color: colors.primary, width: 24 },
  addLink: { ...typography.labelMd, color: colors.primary, marginTop: spacing.sm },
  footer: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceVariant },
});
}
