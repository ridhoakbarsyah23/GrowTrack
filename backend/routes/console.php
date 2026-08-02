<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('pathly:import-master-data {--file= : Path to master data JSON} {--dry-run : Validate without writing}', function () {
    try {
        $data = loadPathlyMasterData($this->option('file'));
    } catch (Throwable $exception) {
        $this->error($exception->getMessage());

        return self::FAILURE;
    }

    $errors = validatePathlyMasterData($data);

    if ($errors) {
        foreach ($errors as $error) {
            $this->error($error);
        }

        return self::FAILURE;
    }

    $counts = pathlyMasterDataCounts($data);

    $this->info('Pathly master data is valid.');
    foreach ($counts as $label => $count) {
        $this->line("{$label}: {$count}");
    }

    if ($this->option('dry-run')) {
        $this->comment('Dry run only. No database changes were made.');

        return self::SUCCESS;
    }

    DB::transaction(function () use ($data): void {
        importPathlyMasterData($data);
    });

    $this->info('Pathly master data imported successfully.');

    return self::SUCCESS;
})->purpose('Import reviewed Pathly AI master data from JSON');

if (! function_exists('validatePathlyMasterData')) {
function validatePathlyMasterData(array $data): array
{
    $errors = [];
    $requiredSections = ['career_goals', 'skills', 'assessment_templates', 'roadmap_modules', 'products'];

    foreach ($requiredSections as $section) {
        if (! isset($data[$section]) || ! is_array($data[$section])) {
            $errors[] = "Missing or invalid section: {$section}";
        }
    }

    if ($errors) {
        return $errors;
    }

    $skillKeys = array_column($data['skills'], 'key');
    $goalKeys = array_column($data['career_goals'], 'key');
    $templateKeys = array_column($data['assessment_templates'], 'key');
    $roadmapKeys = array_column($data['roadmap_modules'], 'key');

    foreach ([
        'skills' => $skillKeys,
        'career_goals' => $goalKeys,
        'assessment_templates' => $templateKeys,
        'roadmap_modules' => $roadmapKeys,
    ] as $section => $keys) {
        $duplicates = array_unique(array_diff_assoc($keys, array_unique($keys)));

        foreach ($duplicates as $duplicate) {
            $errors[] = "Duplicate key in {$section}: {$duplicate}";
        }
    }

    foreach ($data['career_goals'] as $goal) {
        foreach (['key', 'audience', 'title', 'level', 'summary', 'skill_targets', 'assessment_template_key', 'roadmap_module_keys'] as $field) {
            if (! array_key_exists($field, $goal)) {
                $errors[] = "Career goal is missing {$field}.";
            }
        }

        foreach (($goal['skill_targets'] ?? []) as $skillKey => $targetScore) {
            if (! in_array($skillKey, $skillKeys, true)) {
                $errors[] = "Career goal {$goal['key']} references missing skill {$skillKey}.";
            }

            if (! is_int($targetScore) || $targetScore < 1 || $targetScore > 100) {
                $errors[] = "Career goal {$goal['key']} has invalid target score for {$skillKey}.";
            }
        }

        if (! in_array($goal['assessment_template_key'] ?? null, $templateKeys, true)) {
            $errors[] = "Career goal {$goal['key']} references missing assessment template.";
        }

        foreach (($goal['roadmap_module_keys'] ?? []) as $roadmapKey) {
            if (! in_array($roadmapKey, $roadmapKeys, true)) {
                $errors[] = "Career goal {$goal['key']} references missing roadmap module {$roadmapKey}.";
            }
        }
    }

    foreach ($data['assessment_templates'] as $template) {
        foreach (($template['questions'] ?? []) as $question) {
            if (! in_array($question['skill_key'] ?? null, $skillKeys, true)) {
                $errors[] = "Assessment template {$template['key']} references missing skill in a question.";
            }
        }
    }

    foreach ($data['roadmap_modules'] as $module) {
        if (! in_array($module['career_goal_key'] ?? null, $goalKeys, true)) {
            $errors[] = "Roadmap module {$module['key']} references missing career goal.";
        }

        if (! in_array($module['skill_key'] ?? null, $skillKeys, true)) {
            $errors[] = "Roadmap module {$module['key']} references missing skill.";
        }
    }

    return $errors;
}
}

if (! function_exists('pathlyMasterDataCounts')) {
function pathlyMasterDataCounts(array $data): array
{
    $questionCount = 0;

    foreach ($data['assessment_templates'] as $template) {
        $questionCount += count($template['questions'] ?? []);
    }

    return [
        'career_goals' => count($data['career_goals']),
        'skills' => count($data['skills']),
        'skill_targets' => array_sum(array_map(fn (array $goal) => count($goal['skill_targets'] ?? []), $data['career_goals'])),
        'assessment_templates' => count($data['assessment_templates']),
        'assessment_questions' => $questionCount,
        'roadmap_modules' => count($data['roadmap_modules']),
        'products' => count($data['products']),
    ];
}
}

if (! function_exists('importPathlyMasterData')) {
function importPathlyMasterData(array $data): void
{
    $now = now();
    $skillIds = [];
    $careerGoalIds = [];
    $assessmentTemplateIds = [];

    foreach ($data['skills'] as $skill) {
        DB::table('skills')->updateOrInsert(
            ['name' => $skill['name']],
            [
                'category' => $skill['category'],
                'description' => $skill['description'],
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        $skillIds[$skill['key']] = DB::table('skills')->where('name', $skill['name'])->value('id');
    }

    foreach ($data['career_goals'] as $goal) {
        DB::table('career_goals')->updateOrInsert(
            [
                'audience' => $goal['audience'],
                'title' => $goal['title'],
            ],
            [
                'level' => $goal['level'],
                'summary' => $goal['summary'],
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        $goalId = DB::table('career_goals')
            ->where('audience', $goal['audience'])
            ->where('title', $goal['title'])
            ->value('id');
        $careerGoalIds[$goal['key']] = $goalId;

        foreach ($goal['skill_targets'] as $skillKey => $targetScore) {
            DB::table('career_goal_skill')->updateOrInsert(
                [
                    'career_goal_id' => $goalId,
                    'skill_id' => $skillIds[$skillKey],
                ],
                [
                    'target_score' => $targetScore,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    foreach ($data['assessment_templates'] as $template) {
        DB::table('assessment_templates')->updateOrInsert(
            [
                'audience' => $template['audience'],
                'title' => $template['title'],
            ],
            [
                'description' => $template['description'],
                'question_count' => count($template['questions'] ?? []),
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );

        $templateId = DB::table('assessment_templates')
            ->where('audience', $template['audience'])
            ->where('title', $template['title'])
            ->value('id');
        $assessmentTemplateIds[$template['key']] = $templateId;

        foreach ($template['questions'] as $question) {
            DB::table('assessment_questions')->updateOrInsert(
                [
                    'assessment_template_id' => $templateId,
                    'question' => $question['question'],
                ],
                [
                    'skill_id' => $skillIds[$question['skill_key']],
                    'weight' => $question['weight'],
                    'max_score' => $question['max_score'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );
        }
    }

    foreach ($data['roadmap_modules'] as $module) {
        DB::table('roadmap_modules')->updateOrInsert(
            [
                'career_goal_id' => $careerGoalIds[$module['career_goal_key']],
                'sequence' => $module['sequence'],
                'title' => $module['title'],
            ],
            [
                'skill_id' => $skillIds[$module['skill_key']],
                'module_type' => $module['module_type'],
                'duration_hours' => $module['duration_hours'],
                'outcome' => $module['outcome'],
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );
    }

    foreach ($data['products'] as $product) {
        DB::table('learning_products')->updateOrInsert(
            ['slug' => $product['slug']],
            [
                'type' => $product['type'],
                'title' => $product['title'],
                'category' => $product['category'],
                'level' => $product['level'],
                'price' => $product['price'],
                'description' => $product['description'],
                'outcome' => $product['outcome'],
                'lesson_count' => $product['lesson_count'],
                'duration' => $product['duration'],
                'scheduled_at' => $product['scheduled_at'],
                'seat_limit' => $product['seat_limit'],
                'meeting_url' => $product['meeting_url'],
                'material_url' => $product['material_url'],
                'status' => $product['status'],
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );
    }
}
}

if (! function_exists('pathlyMasterDataTemplatePath')) {
function pathlyMasterDataTemplatePath(?string $path = null): string
{
    return $path ?: storage_path('app/pathly-master-data-template.json');
}
}

if (! function_exists('loadPathlyMasterData')) {
function loadPathlyMasterData(?string $path = null): array
{
    $resolvedPath = pathlyMasterDataTemplatePath($path);

    if (! is_file($resolvedPath)) {
        throw new RuntimeException("Master data file not found: {$resolvedPath}");
    }

    return json_decode(file_get_contents($resolvedPath), true, 512, JSON_THROW_ON_ERROR);
}
}
