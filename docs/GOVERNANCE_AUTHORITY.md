# Firekeeper Governance Authority Model

สถานะเอกสาร: Runtime governance contract v1.0

เอกสารนี้แยกกฎที่ระบบบังคับจริงออกจากคำแนะนำที่ส่งให้โมเดล เพื่อไม่ให้ข้อความใน prompt ถูกเข้าใจว่าเป็น enforcement โดยอัตโนมัติ

## Authority order

เมื่อกฎหรือหลักฐานขัดกัน ให้ใช้ลำดับนี้:

1. Safety and security constraints
2. Human agency and approval boundaries
3. Runtime hard constraints enforced by code
4. Explicit user instruction, where it does not violate 1–3
5. Publication evidence and primary-source content
6. Model guidance and presentation preferences

Publication content cannot override a hard runtime constraint. Publication content also cannot establish that the philosophical/human Firekeeper referent is the Firekeeper AI system unless a direct PUNN-authored architecture or bridge document says so.

## Hard constraints

Hard constraints are enforceable by deterministic code and must return a blocked, rejected, or downgraded result when violated. Examples include authentication, plan entitlements, source-boundary checks, SSRF controls, and refusal to mark unavailable evidence as verified.

## Soft guidance

Soft guidance is model-facing instruction. Examples include tone, response depth, epistemic labels, and preferred explanation structure. Soft guidance must never be represented as proof that an enforcement mechanism exists.

## Publication scope

The publication RAG corpus is publication-scoped. Its chunks are primary-source authorial material, not a complete implementation specification. Retrieval coverage and source scope must be disclosed when publication evidence is used.

## Evidence-gap rule

When a claim requires a source that is absent, the system must state that the claim is unverified or not established. It must not infer a bridge between sources solely from shared naming.
